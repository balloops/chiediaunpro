
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// ID preso dal tuo screenshot di Google Ads
const GOOGLE_TAG_ID = 'AW-17860692063';

export const analyticsService = {
  
  // Inizializza il Google Tag (gtag.js)
  initialize: () => {
    if (typeof window === 'undefined') return;
    if (window.dataLayer && window.gtag) return; // Già inizializzato

    // 1. Setup dataLayer e funzione gtag globale
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    // 2. Comandi base come da istruzioni Google
    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_TAG_ID);

    // 3. Iniezione asincrona dello script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`;
    
    // Gestione errore caricamento script (opzionale ma utile)
    script.onerror = () => {
      console.error('[Analytics] Errore caricamento script Google Ads');
    };

    document.head.appendChild(script);

    console.log(`[Analytics] Google Tag inizializzato: ${GOOGLE_TAG_ID}`);
  },

  // Traccia il cambio pagina (Virtual Page View per SPA)
  trackPageView: (path: string) => {
    if (!window.gtag) return;
    
    // Invia un evento page_view a Google
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
      send_to: GOOGLE_TAG_ID
    });
    console.debug(`[Analytics] Page View: ${path}`);
  },

  // Traccia eventi personalizzati (Conversioni Ads, Azioni utente)
  // Esempio: trackEvent('conversion', { 'send_to': 'AW-17860692063/EtichettaConversione' })
  trackEvent: (eventName: string, data: Record<string, any> = {}) => {
    if (!window.gtag) return;

    window.gtag('event', eventName, {
      ...data,
      send_to: GOOGLE_TAG_ID // Assicura che l'evento vada all'account Ads corretto
    });
    console.debug(`[Analytics] Event: ${eventName}`, data);
  },

  // Verifica se il consenso è già stato dato
  hasConsent: (): boolean => {
    return !!localStorage.getItem('chiediunpro_gdpr_consent');
  }
};
