
import { supabase } from './supabaseClient';
import { Notification, NotificationType } from '../types';

export const notificationService = {
  
  // Fetch delle ultime 8 notifiche dal DB
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error("Supabase Error (getNotifications):", error.message);
      return [];
    }

    // Map DB casing to camelCase
    return data.map((n: any) => ({
      ...n,
      userId: n.user_id,
      isRead: n.is_read,
      createdAt: n.created_at
    }));
  },

  // Aggiunge notifica e pulisce quelle vecchie (Mantiene solo le ultime 8)
  async addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    try {
      // 1. Inserisci la nuova notifica
      const dbNotification = {
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        metadata: notification.metadata,
        is_read: false
      };

      const { error } = await supabase.from('notifications').insert([dbNotification]);
      if (error) throw error;

      // 2. Pulizia (Logica FIFO migliorata)
      const { data: allUserNotifs } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', notification.userId)
        .order('created_at', { ascending: false });

      if (allUserNotifs && allUserNotifs.length > 8) {
        const idsToDelete = allUserNotifs.slice(8).map(x => x.id);
        
        if (idsToDelete.length > 0) {
          await supabase
            .from('notifications')
            .delete()
            .in('id', idsToDelete);
        }
      }

    } catch (e: any) {
      console.error("Error adding notification:", e.message || e);
    }
  },

  async markAsRead(id: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  },

  async markAllAsRead(userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
  },

  // Helpers to trigger specific notifications with NEW Routing links
  async notifyNewOpportunity(proId: string, category: string, jobId: string): Promise<void> {
    await this.addNotification({
      userId: proId,
      type: NotificationType.NEW_OPPORTUNITY,
      title: 'Nuova Opportunità!',
      message: `È stata pubblicata una nuova richiesta per: ${category}.`,
      link: `/dashboard/job/${jobId}`, // Direct link to Job Detail
      metadata: { jobId }
    });
  },

  async notifyNewQuote(clientId: string, proName: string, category: string, jobId: string): Promise<void> {
    await this.addNotification({
      userId: clientId,
      type: NotificationType.NEW_QUOTE,
      title: 'Nuovo Preventivo Ricevuto',
      message: `${proName} ha inviato una proposta per il tuo progetto ${category}.`,
      link: `/dashboard/job/${jobId}`, // Client goes to Job Detail to see quotes
      metadata: { jobId }
    });
  },

  async notifyQuoteAccepted(proId: string, clientName: string, quoteId: string): Promise<void> {
    await this.addNotification({
      userId: proId,
      type: NotificationType.QUOTE_ACCEPTED,
      title: 'Congratulazioni! Proposta Accettata',
      message: `${clientName} ha scelto la tua proposta. Inizia a collaborare!`,
      link: `/dashboard/quote/${quoteId}`, // Pro goes to Quote Detail to see contact info
      metadata: { quoteId }
    });
  },

  async notifyQuoteRejected(proId: string, clientName: string, quoteId: string): Promise<void> {
    await this.addNotification({
      userId: proId,
      type: NotificationType.QUOTE_REJECTED,
      title: 'Aggiornamento Proposta',
      message: `Ci dispiace, ${clientName} ha deciso di non procedere con la tua proposta.`,
      link: `/dashboard/quote/${quoteId}`,
      metadata: { quoteId }
    });
  }
};
