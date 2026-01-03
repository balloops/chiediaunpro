
import { supabase } from './supabaseClient';

// Ottiene l'URL base pulito (es. https://lavorabene.app o http://localhost:5173)
const getBaseUrl = () => {
  return window.location.origin + window.location.pathname;
};

export const emailService = {
  /**
   * Invia una mail tramite Supabase Edge Function ('send-email')
   */
  async sendEmail(to: string, subject: string, htmlBody: string, context?: string) {
    console.log(`[EMAIL SERVICE] Preparazione invio a: ${to} | Oggetto: ${subject}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          to, 
          subject, 
          html: htmlBody,
          context // Passiamo il contesto (es. 'new_quote') per logiche future
        },
      });

      if (error) {
        // Se la funzione non è ancora deployata, mostriamo un avviso gentile in console
        console.warn(`[EMAIL SERVICE] La funzione Supabase 'send-email' non ha risposto correttamente. Verifica di averla deployata. Errore:`, error.message);
        return false;
      }

      console.log(`[EMAIL SERVICE] Email inviata con successo!`, data);
      return true;

    } catch (e) {
      console.warn(`[EMAIL SERVICE] Errore di connessione o configurazione:`, e);
      return false;
    }
  },

  /**
   * Notifica il Cliente che ha ricevuto un nuovo preventivo
   */
  async notifyClientNewQuote(clientEmail: string, clientName: string, proName: string, jobTitle: string, jobId: string) {
    const baseUrl = getBaseUrl();
    // Costruiamo il link diretto alla tab corretta
    const link = `${baseUrl}#/dashboard/job/${jobId}?tab=my-requests`;
    
    const subject = `Nuovo preventivo per "${jobTitle}"`;
    
    // Template HTML responsivo e pulito
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #111827; margin: 0;">LavoraBene</h2>
        </div>
        <div style="margin-bottom: 24px;">
          <p style="font-size: 16px; color: #374151;">Ciao <strong>${clientName}</strong>,</p>
          <p style="font-size: 16px; color: #374151;">Ottime notizie! <strong>${proName}</strong> ha appena inviato una proposta per la tua richiesta <strong>"${jobTitle}"</strong>.</p>
          <p style="font-size: 16px; color: #374151;">Accedi subito per vedere il prezzo, le tempistiche e il messaggio del professionista.</p>
        </div>
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${link}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Visualizza Preventivo</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          Hai ricevuto questa email perché hai pubblicato una richiesta su LavoraBene.<br/>
          Se il bottone non funziona, copia questo link: ${link}
        </p>
      </div>
    `;

    await this.sendEmail(clientEmail, subject, html, 'new_quote');
  },

  /**
   * Notifica il Professionista che il suo preventivo è stato accettato
   */
  async notifyProQuoteAccepted(proEmail: string, proName: string, clientName: string, jobTitle: string, quoteId: string) {
    const baseUrl = getBaseUrl();
    const link = `${baseUrl}#/dashboard/quote/${quoteId}?tab=won`;

    const subject = `🎉 Preventivo accettato: "${jobTitle}"`;
    
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #111827; margin: 0;">LavoraBene</h2>
        </div>
        <div style="margin-bottom: 24px;">
          <h3 style="color: #059669; margin-top: 0;">Congratulazioni ${proName}!</h3>
          <p style="font-size: 16px; color: #374151;">Il cliente <strong>${clientName}</strong> ha accettato la tua proposta per il progetto <strong>"${jobTitle}"</strong>.</p>
          <p style="font-size: 16px; color: #374151; background-color: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0;">
            I contatti del cliente sono stati sbloccati. Puoi ora contattarlo direttamente per iniziare il lavoro.
          </p>
        </div>
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${link}" style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Vedi Contatti Cliente</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          Buon lavoro dal team di LavoraBene.
        </p>
      </div>
    `;

    await this.sendEmail(proEmail, subject, html, 'quote_accepted');
  }
};
