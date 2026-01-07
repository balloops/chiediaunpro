import { supabase } from './supabaseClient';

// Ottiene l'URL base pulito gestendo Hash Router
const getBaseUrl = () => {
  return window.location.origin + window.location.pathname;
};

// 1. CONFIGURAZIONE EMAIL
const OFFICIAL_INFO_EMAIL = 'info@lavorabene.it'; // Indirizzo pubblico per le risposte (Reply-To)
const ADMIN_ALERT_EMAIL = 'tuamail@gmail.com';    // Indirizzo dove l'admin riceve gli avvisi (es. nuove iscrizioni)

export const emailService = {
  /**
   * Invia una mail tramite Supabase Edge Function ('send-email')
   */
  async sendEmail(to: string, subject: string, htmlBody: string, context?: string, replyTo?: string) {
    console.log(`[EMAIL SERVICE] 🚀 Tentativo invio a: ${to} | Oggetto: ${subject}`);
    
    // Configurazione Reply-To:
    // Se non specificato diversamente, tutte le risposte vanno a info@lavorabene.it
    const finalReplyTo = replyTo || OFFICIAL_INFO_EMAIL;

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          to, 
          subject, 
          html: htmlBody,
          context,
          reply_to: finalReplyTo 
        },
      });

      if (error) {
        console.error(`[EMAIL SERVICE] ❌ Errore Invio Edge Function:`, error);
        
        // TENTATIVO DIAGNOSTICO
        if (error.message.includes("Failed to send a request") || error.message.includes("Failed to fetch")) {
            return { 
                success: false, 
                error: "ERRORE DEPLOY: La funzione non risponde. Vai sul tuo repository GitHub, clicca su 'Actions' e controlla se il workflow 'Deploy Supabase Functions' è fallito o se mancano i Secrets (SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_ID)." 
            };
        }

        if (error instanceof Error) return { success: false, error: error.message };
        return { success: false, error: JSON.stringify(error) };
      }

      if (data?.error) {
         console.error(`[EMAIL SERVICE] ⚠️ Errore Resend API:`, data.error);
         return { success: false, error: `Resend Error: ${JSON.stringify(data.error)}` };
      }

      console.log(`[EMAIL SERVICE] ✅ Email inviata con successo!`, data);
      return { success: true, data };

    } catch (e: any) {
      console.error(`[EMAIL SERVICE] 💥 Eccezione critica:`, e);
      return { success: false, error: e.message };
    }
  },

  /**
   * 1. Notifica Admin: Nuovo Utente Registrato (Logica differenziata Pro/Cliente)
   */
  async notifyAdminNewUser(userEmail: string, userName: string, userRole: string) {
    const isPro = userRole === 'PROFESSIONAL';
    const roleLabel = isPro ? 'Professionista' : 'Cliente';
    const color = isPro ? '#4f46e5' : '#059669'; // Blu per Pro, Verde per Clienti

    const subject = `[Admin] Nuovo ${roleLabel} registrato: ${userName}`;
    
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: ${color};">Nuova Registrazione: ${roleLabel}</h2>
        <p>Un nuovo <strong>${roleLabel}</strong> si è appena iscritto alla piattaforma.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 10px;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Nome:</strong> ${userName}</li>
            <li style="margin-bottom: 8px;"><strong>Email:</strong> ${userEmail}</li>
            <li style="margin-bottom: 8px;"><strong>Ruolo:</strong> ${userRole}</li>
            <li><strong>Data:</strong> ${new Date().toLocaleString('it-IT')}</li>
          </ul>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">Accedi alla Dashboard Admin per verificare i dettagli.</p>
      </div>
    `;
    // Invia all'admin reale, reply-to default (info@lavorabene.it)
    return await this.sendEmail(ADMIN_ALERT_EMAIL, subject, html, 'admin_new_user');
  },

  /**
   * 2. Notifica Cliente: Job Pubblicato con successo
   */
  async notifyClientJobPosted(clientEmail: string, clientName: string, jobTitle: string, jobId: string) {
    const baseUrl = getBaseUrl();
    const link = `${baseUrl}#/dashboard/job/${jobId}?tab=my-requests`;
    const subject = `Richiesta pubblicata: "${jobTitle}"`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #111827;">Richiesta pubblicata con successo!</h2>
        <p>Ciao <strong>${clientName}</strong>,</p>
        <p>La tua richiesta per <strong>"${jobTitle}"</strong> è ora visibile ai professionisti.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Vedi la tua richiesta</a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">Hai domande? Rispondi direttamente a questa email.</p>
      </div>
    `;
    // Reply-To impostato su info@lavorabene.it
    return await this.sendEmail(clientEmail, subject, html, 'client_job_posted', OFFICIAL_INFO_EMAIL);
  },

  /**
   * 3. Notifica Cliente: Nuovo Preventivo Ricevuto
   */
  async notifyClientNewQuote(clientEmail: string, clientName: string, proName: string, jobTitle: string, jobId: string) {
    const baseUrl = getBaseUrl();
    const link = `${baseUrl}#/dashboard/job/${jobId}?tab=my-requests`;
    const subject = `Nuovo preventivo per "${jobTitle}"`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #111827;">Nuova proposta ricevuta</h2>
        <p>Ciao <strong>${clientName}</strong>,</p>
        <p>Ottime notizie! <strong>${proName}</strong> ha inviato una proposta per il tuo progetto <strong>"${jobTitle}"</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Leggi il Preventivo</a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 20px; text-align: center;">Per assistenza, rispondi a questa email.</p>
      </div>
    `;
    return await this.sendEmail(clientEmail, subject, html, 'new_quote', OFFICIAL_INFO_EMAIL);
  },

  /**
   * 4. Notifica Pro: Preventivo Accettato
   */
  async notifyProQuoteAccepted(proEmail: string, proName: string, clientName: string, jobTitle: string, quoteId: string) {
    const baseUrl = getBaseUrl();
    const link = `${baseUrl}#/dashboard/quote/${quoteId}?tab=won`;
    const subject = `🎉 Preventivo accettato: "${jobTitle}"`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #059669;">Congratulazioni ${proName}!</h2>
        <p>Il cliente <strong>${clientName}</strong> ha accettato la tua proposta per il progetto <strong>"${jobTitle}"</strong>.</p>
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #a7f3d0; margin: 20px 0;">
          <p style="margin: 0; color: #065f46; font-weight: bold;">I contatti del cliente sono stati sbloccati.</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Vedi Contatti Cliente</a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 20px; text-align: center;">Dubbi o domande? Rispondi a questa email.</p>
      </div>
    `;
    return await this.sendEmail(proEmail, subject, html, 'quote_accepted', OFFICIAL_INFO_EMAIL);
  }
};