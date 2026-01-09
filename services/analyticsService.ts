
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// ID presi dai tuoi account
const GOOGLE_ADS_ID = 'AW-17860692063';
const GA_MEASUREMENT_ID = 'G-1BGC7SLFPV';

export const analyticsService = {
  
  // Inizializza il Google Tag (gtag.js) per entrambi i servizi
  initialize: () => {
    if (typeof window === 'undefined') return;
    if (window.dataLayer && window.gtag) return; // Già inizializzato

    // 1. Setup dataLayer e funzione gtag globale
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    // 2. Comandi base e configurazione multi-account
    window.gtag('js', new Date());
    
    // Configurazione Google Ads
    window.gtag('config', GOOGLE_ADS_ID);
    
    // Configurazione Google Analytics 4
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false // Gestiamo le page_view manualmente tramite RouteTracker per precisione SPA
    });

    // 3. Iniezione asincrona dello script (usiamo GA come sorgente principale)
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    
    script.onerror = () => {
      console.error('[Analytics] Errore caricamento script Google Tag');
    };

    document.head.appendChild(script);

    console.log(`[Analytics] Google Tag inizializzato per Ads (${GOOGLE_ADS_ID}) e Analytics (${GA_MEASUREMENT_ID})`);
  },

  // Traccia il cambio pagina (Virtual Page View per SPA)
  trackPageView: (path: string) => {
    if (!window.gtag) return;
    
    // Invia l'evento page_view a Google Analytics
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
      send_to: GA_MEASUREMENT_ID
    });
    console.debug(`[Analytics] Page View inviata a GA4: ${path}`);
  },

  // Traccia eventi personalizzati (Conversioni Ads, Azioni utente)
  trackEvent: (eventName: string, data: Record<string, any> = {}) => {
    if (!window.gtag) return;

    // Se l'evento è per Ads, assicuriamoci di inviarlo all'ID corretto, 
    // altrimenti lo inviamo a entrambi (comportamento di default)
    window.gtag('event', eventName, {
      ...data
    });
    console.debug(`[Analytics] Event: ${eventName}`, data);
  },

  // Verifica se il consenso è già stato dato
  hasConsent: (): boolean => {
    return !!localStorage.getItem('chiediunpro_gdpr_consent');
  }
};
