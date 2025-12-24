
import { Notification, NotificationType } from '../types';

const NOTIFICATIONS_KEY = 'chiediunpro_notifications';

export const notificationService = {
  getNotifications(userId: string): Notification[] {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: Notification[] = data ? JSON.parse(data) : [];
    return all.filter(n => n.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): void {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: Notification[] = data ? JSON.parse(data) : [];
    
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    all.unshift(newNotification);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all.slice(0, 100))); // Keep last 100
  },

  markAsRead(id: string): void {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data) return;
    const all: Notification[] = JSON.parse(data);
    const index = all.findIndex(n => n.id === id);
    if (index !== -1) {
      all[index].isRead = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    }
  },

  markAllAsRead(userId: string): void {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data) return;
    const all: Notification[] = JSON.parse(data);
    const updated = all.map(n => n.userId === userId ? { ...n, isRead: true } : n);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  // Helpers to trigger specific notifications
  notifyNewOpportunity(proId: string, category: string, jobId: string): void {
    this.addNotification({
      userId: proId,
      type: NotificationType.NEW_OPPORTUNITY,
      title: 'Nuova Opportunità!',
      message: `È stata pubblicata una nuova richiesta per: ${category}.`,
      link: '/dashboard',
      metadata: {
        jobId,
        targetTab: 'leads'
      }
    });
  },

  notifyNewQuote(clientId: string, proName: string, category: string, jobId: string): void {
    this.addNotification({
      userId: clientId,
      type: NotificationType.NEW_QUOTE,
      title: 'Nuovo Preventivo Ricevuto',
      message: `${proName} ha inviato una proposta per il tuo progetto ${category}.`,
      link: '/dashboard',
      metadata: {
        jobId,
        targetTab: 'my-requests'
      }
    });
  },

  notifyQuoteAccepted(proId: string, clientName: string, quoteId: string): void {
    this.addNotification({
      userId: proId,
      type: NotificationType.QUOTE_ACCEPTED,
      title: 'Congratulazioni! Proposta Accettata',
      message: `${clientName} ha scelto la tua proposta. Inizia a collaborare!`,
      link: '/dashboard',
      metadata: {
        quoteId,
        targetTab: 'won'
      }
    });
  },

  notifyQuoteRejected(proId: string, clientName: string, quoteId: string): void {
    this.addNotification({
      userId: proId,
      type: NotificationType.QUOTE_REJECTED,
      title: 'Aggiornamento Proposta',
      message: `Ci dispiace, ${clientName} ha deciso di non procedere con la tua proposta.`,
      link: '/dashboard',
      metadata: {
        quoteId,
        targetTab: 'quotes'
      }
    });
  }
};
