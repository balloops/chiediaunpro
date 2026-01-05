
import { supabase } from './supabaseClient';

// Ottiene l'URL base pulito gestendo Hash Router
const getBaseUrl = () => {
  return window.location.origin + window.location.pathname;
};

// Email dell'Admin per le notifiche di sistema
const ADMIN_EMAIL = 'admin@lavorabene.it'; 

export const emailService = {
  /**
   * Invia una mail tramite Supabase Edge Function ('send-email')
   */
  async sendEmail(to: string, subject: string, htmlBody: string, context?: string, replyTo?: string) {
    console.log(`[EMAIL SERVICE] 🚀 Tentativo invio a: ${to} | Oggetto: ${subject}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          to, 
          subject, 
          html: htmlBody,
          context,
          reply_to: replyTo 
        },
      });

      if (error) {
        console.error(`[EMAIL SERVICE] ❌ Errore Invio Edge Function:`, error);
        
        // TENTATIVO DIAGNOSTICO: Verifichiamo se la funzione esiste
        if (error.message.includes("Failed to send a request")) {
            return await this.runDiagnostics();
        }

        if (error instanceof Error) return { success: false, error: error.message };
        return { success: false, error: JSON.stringify(error) };
      }

      // Se la funzione risponde ma Resend restituisce errore
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
   * Esegue una chiamata fetch diretta per capire se la funzione è deployata
   */
  async runDiagnostics() {
      try {
          // Ricostruiamo l'URL della funzione basandoci sulla config di Supabase
          // @ts-ignore - Accediamo a proprietà private per debug
          const projectUrl = supabase.supabaseUrl; 
          const functionUrl = `${projectUrl}/functions/v1/send-email`;
          
          console.log(`[DIAGNOSTICS] Pingo direttamente: ${functionUrl}`);
          
          const response = await fetch(functionUrl, {
              method: 'OPTIONS', // Una richiesta OPTIONS dovrebbe sempre rispondere 200 OK se la funzione esiste e ha CORS
          });

          if (response.status === 404) {
              return { success: false, error: "ERRORE 404: La funzione 'send-email' NON esiste su Supabase. Devi fare il deploy." };
          } else if (!response.ok) {
              return { success: false, error: `ERRORE HTTP ${response.status}: La funzione esiste ma risponde con errore.` };
          } else {
              return { success: false, error: "ERRORE MISTERO: La funzione è raggiungibile ma la chiamata SDK fallisce. Verifica AdBlocker o VPN." };
          }
      } catch (err: any) {
          return { success: false, error: `ERRORE DI RETE: Impossibile raggiungere Supabase. ${err.message}` };
      }
  },

  /**
   * 1. Notifica Admin: Nuovo Utente Registrato
   */
  async notifyAdminNewUser(userEmail: string, userName: string, userRole: string) {
    const subject = `[Admin] Nuovo utente registrato: ${userName}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Nuova Registrazione</h2>
        <p>Un nuovo utente si è appena iscritto alla piattaforma.</p>
        <ul>
          <li><strong>Nome:</strong> ${userName}</li>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>Ruolo:</strong> ${userRole === 'PROFESSIONAL' ? 'Professionista' : 'Cliente'}</li>
        </ul>
      </div>
    `;
    return await this.sendEmail(ADMIN_EMAIL, subject, html, 'admin_new_user');
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
      </div>
    `;
    return await this.sendEmail(clientEmail, subject, html, 'client_job_posted', ADMIN_EMAIL);
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
      </div>
    `;
    return await this.sendEmail(clientEmail, subject, html, 'new_quote', ADMIN_EMAIL);
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
      </div>
    `;
    return await this.sendEmail(proEmail, subject, html, 'quote_accepted', ADMIN_EMAIL);
  }
};
