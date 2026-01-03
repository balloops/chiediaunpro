
import { supabase } from './supabaseClient';

const APP_URL = window.location.origin + window.location.pathname; // Base URL (es. https://tuosito.com o localhost)

export const emailService = {
  /**
   * Invia una mail generica tramite Supabase Edge Function
   */
  async sendEmail(to: string, subject: string, htmlBody: string) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    
    try {
      // Tenta di chiamare la Edge Function 'send-email'
      // Nota: Per far funzionare questo realmente, dovrai fare il deploy di una function su Supabase
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html: htmlBody },
      });

      if (error) {
        // Se la function non esiste (comune in dev locale senza setup CLI), non blocchiamo l'app
        console.warn("Supabase Function 'send-email' non configurata o errore:", error.message);
      }
    } catch (e) {
      console.warn("Errore tentativo invio email (ignorabile in dev):", e);
    }
  },

  /**
   * Notifica il Cliente che ha ricevuto un nuovo preventivo
   */
  async notifyClientNewQuote(clientEmail: string, clientName: string, proName: string, jobTitle: string, jobId: string) {
    const link = `${APP_URL}#/dashboard/job/${jobId}?tab=my-requests`;
    
    const subject = `Nuovo preventivo per "${jobTitle}" su LavoraBene`;
    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2>Ciao ${clientName},</h2>
        <p>Buone notizie! <strong>${proName}</strong> ha inviato una proposta per il tuo progetto <strong>"${jobTitle}"</strong>.</p>
        <p>Vai alla tua dashboard per visualizzare i dettagli, il prezzo e il messaggio del professionista.</p>
        <br/>
        <a href="${link}" style="background-color: #0060e3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Vedi Preventivo</a>
        <br/><br/>
        <p style="font-size: 12px; color: #666;">A presto,<br/>Il team di LavoraBene</p>
      </div>
    `;

    await this.sendEmail(clientEmail, subject, html);
  },

  /**
   * Notifica il Professionista che il suo preventivo è stato accettato
   */
  async notifyProQuoteAccepted(proEmail: string, proName: string, clientName: string, jobTitle: string, quoteId: string) {
    const link = `${APP_URL}#/dashboard/quote/${quoteId}?tab=won`;

    const subject = `Congratulazioni! Preventivo accettato per "${jobTitle}"`;
    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2>Grande ${proName}!</h2>
        <p>Il cliente <strong>${clientName}</strong> ha accettato la tua proposta per il progetto <strong>"${jobTitle}"</strong>.</p>
        <p>I contatti del cliente sono ora sbloccati. Accedi subito per metterti in contatto e iniziare il lavoro.</p>
        <br/>
        <a href="${link}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Vedi Contatti Cliente</a>
        <br/><br/>
        <p style="font-size: 12px; color: #666;">Buon lavoro,<br/>Il team di LavoraBene</p>
      </div>
    `;

    await this.sendEmail(proEmail, subject, html);
  }
};
