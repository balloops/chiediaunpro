
import { supabase } from './supabaseClient';
import { PricingPlan, SiteContent, ServiceCategory, PlanType, FormDefinition } from '../types';

// CAMBIO CHIAVI PER FORZARE IL RESET DELLA CACHE LOCALE
const PLANS_KEY = 'lavorabene_plans_v3';
const CATEGORIES_KEY = 'lavorabene_categories_v3';
const FORMS_KEY = 'lavorabene_forms_v5'; 

const defaultContent: SiteContent = {
  branding: {
    platformName: 'LavoraBene',
    // IMPORTANTE: Percorso relativo pulito. Navbar aggiungerà ./ automaticamente
    logoUrl: 'assets/logo/logo-lavorabene.webp', 
    faviconUrl: ''
  },
  auth: {
    register: {
      titleClient: 'Racconta cosa ti serve.',
      titlePro: 'Fai crescere il tuo business.',
      subtitle: "La community di esperti digitali più attiva d'Italia ti aspetta.",
      featuresClient: [
        'Verifica istantanea',
        'Preventivi mirati AI',
        'Pagamenti sicuri',
        'Zero costi fissi'
      ],
      featuresPro: [
        'Verifica istantanea',
        'Clienti di alta qualità',
        'Pagamenti sicuri',
        'Zero costi fissi'
      ],
      ratingLabel: '4.9/5 da 10k+ utenti',
      testimonial: {
        text: '"Il miglior strumento per scalare la mia agenzia. Clienti seri e pagamenti sempre puntuali."',
        author: 'Unisciti ai Pro',
        role: 'Verifica immediata'
      }
    }
  },
  home: {
    hero: {
      title: 'Trova il professionista giusto per il tuo lavoro.',
      subtitle: 'Siti web, e-commerce, social, marketing, video, AI e molto altro. Ricevi proposte mirate da professionisti selezionati, in modo semplice e veloce.',
      badgeText: 'Il tuo progetto digitale, fatto bene',
      ctaPrimary: 'Trova il tuo esperto',
      ctaSecondary: 'Lavora come Pro',
      reviewScore: 'Preventivi gratis',
      reviewCount: 'fatti bene.',
      reviewText: 'e lavori',
      verifiedBadgeTitle: 'Professionisti Verificati', // Default
      verifiedBadgeText: 'Solo esperti con partita IVA' // Default
    },
    stats: {
      users: '+1k',
      projects: '500+',
      rating: '4.9'
    },
    categories: { 
      title: 'Di cosa hai bisogno?',
      description: 'Esplora le categorie principali e trova il talento ideale per scalare il tuo business digitale.'
    },
    features: {
      title: 'Perché scegliere noi?',
      description: 'Velocità, qualità e sicurezza. Abbiamo ridefinito il modo di trovare esperti digitali.',
      items: [
        { title: 'Velocità Ibrida', description: 'Ricevi proposte mirate in poche ore, non giorni.' },
        { title: 'Qualità Certificata', description: 'Verifichiamo manualmente ogni singolo professionista iscritto.' },
        { title: 'Zero Commissioni', description: 'Non paghi commissioni sui lavori trovati tramite noi.' }
      ]
    },
    cta: {
      title: 'Pronto a lanciare il tuo progetto?',
      description: 'Unisciti a migliaia di aziende e professionisti che stanno già rivoluzionando il modo di lavorare nel digitale.',
      buttonClient: 'Trova il tuo esperto',
      buttonPro: 'Crea Profilo Pro'
    }
  },
  howItWorks: {
    header: {
      title: 'Come funziona',
      subtitle: 'La piattaforma che semplifica l\'incontro tra domanda e offerta nel mondo dei servizi digitali. Trasparente, veloce e verificata.'
    },
    tabs: {
      clientLabel: 'Per i Clienti',
      proLabel: 'Per i Professionisti'
    },
    clientSteps: [
      { title: "1. Descrivi il tuo progetto", description: "Compila un modulo semplice e intuitivo. Definisci i dettagli tecnici per ottenere proposte precise." },
      { title: "2. Ricevi proposte mirate", description: "In poche ore ricevi fino a 5 proposte da professionisti qualificati e verificati, interessati al tuo lavoro." },
      { title: "3. Scegli il migliore", description: "Confronta profili, portfolio e prezzi. Scegli il Pro giusto e inizia a collaborare senza commissioni aggiuntive." }
    ],
    proSteps: [
      { title: "1. Crea il tuo profilo Pro", description: "Registrati gratuitamente, inserisci le tue competenze, il portfolio e definisci i tuoi servizi digitali." },
      { title: "2. Trova nuovi clienti", description: "Accedi a una bacheca di opportunità filtrate in base alle tue skills. Niente più ricerca a freddo." },
      { title: "3. Invia proposte e vinci", description: "Usa i tuoi crediti per rispondere alle richieste. Se il cliente ti sceglie, il lavoro è tutto tuo." }
    ],
    cta: {
      titleClient: 'Hai un progetto in mente?',
      buttonClient: 'Pubblica Richiesta Gratis',
      titlePro: 'Sei pronto a trovare nuovi clienti?',
      buttonPro: 'Inizia come Pro'
    }
  },
  helpCenter: {
    title: 'Come possiamo aiutarti?',
    items: [
      {
        question: "È gratuito pubblicare una richiesta?",
        answer: "Assolutamente sì. Pubblicare una richiesta su LavoraBene è completamente gratuito per i clienti.",
        category: 'general'
      },
      {
        question: "Come scelgo il professionista giusto?",
        answer: "Guarda il portfolio, le recensioni e l'esperienza. Confronta le proposte sulla qualità, non solo sul prezzo.",
        category: 'trust'
      },
      {
        question: "I professionisti sono verificati?",
        answer: "Sì, verifichiamo manualmente ogni professionista. Badge 'Verificato' significa documentazione validata.",
        category: 'trust'
      },
      {
        question: "Come funzionano i Crediti?",
        answer: "I crediti servono per inviare proposte. Il piano FREE ne include 3/mese, PRO 20/mese.",
        category: 'payments'
      }
    ]
  },
  footer: {
    aboutText: 'Il marketplace verticale per i professionisti del digitale in Italia.',
    legalLinks: ['Privacy Policy', 'Termini e Condizioni', 'Cookie Policy']
  }
};

const defaultPlans: PricingPlan[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    credits: 5,
    features: ['5 crediti al mese', 'Profilo base', 'Supporto standard']
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 29,
    credits: 50,
    features: ['50 crediti al mese', 'Profilo verificato', 'Supporto prioritario', 'Badge Pro'],
    isPopular: true
  },
  {
    id: 'AGENCY',
    name: 'Agency',
    price: 99,
    credits: 'UNLIMITED',
    features: ['Crediti illimitati', 'Multi-utente', 'Account manager dedicato', 'API access']
  }
];

const defaultForms: FormDefinition[] = [
  {
    categoryId: 'Siti web', // Aggiornato
    fields: [
      { id: 'type', label: 'Tipologia sito', type: 'radio_group', options: ['Landing Page (1 Pagina)', 'Sito Aziendale (Vetrina)', 'Portale/Web App', 'Blog/Editoriale'] },
      { id: 'status', label: 'Stato attuale', type: 'select', options: ['Parto da zero', 'Ho già il design', 'Ho già un sito vecchio da rifare', 'Ho solo il logo'] },
      { id: 'cms', label: 'Preferenza Tecnologia', type: 'select', options: ['WordPress/Elementor', 'Webflow', 'Codice Custom (React/Next.js)', 'Nessuna preferenza (Consigliami tu)'] },
      { id: 'features', label: 'Funzionalità necessarie', type: 'multiselect', options: ['Multilingua', 'Area Riservata', 'Prenotazioni Online', 'Integrazione Newsletter', 'Blog', 'Chatbot'] }
    ],
    budgetOptions: ['Da Stimare', '< 500€', '500 - 1.500€', '1.500 - 3.000€', '3.000€+'],
    askLocation: true,
    descriptionPlaceholder: "Esempio: Vorrei un sito moderno per il mio studio di architettura. Mi piacciono i siti minimalisti. Ho bisogno di una sezione portfolio e contatti. Ho già le foto dei progetti."
  },
  {
    categoryId: 'E-commerce',
    fields: [
      { id: 'products_count', label: 'Quanti prodotti venderai?', type: 'select', options: ['1-10', '10-100', '100-1000', '1000+'] },
      { id: 'platform', label: 'Piattaforma preferita', type: 'radio_group', options: ['Shopify', 'WooCommerce', 'PrestaShop', 'Custom / Altro'] },
      { id: 'sector', label: 'Settore merceologico', type: 'select', options: ['Abbigliamento/Moda', 'Elettronica', 'Cibo & Bevande', 'Arredamento', 'Servizi', 'Altro'] },
      { id: 'integrations', label: 'Integrazioni richieste', type: 'multiselect', options: ['Gestionale Magazzino', 'Fatturazione Automatica', 'Amazon/eBay Sync', 'Klarna/Scalapay', 'Spedizioni Automatizzate'] }
    ],
    budgetOptions: ['Da Stimare', '< 1.500€', '1.500 - 3.000€', '3.000 - 6.000€', '6.000€+'],
    askLocation: true,
    descriptionPlaceholder: "Descrivi il tuo progetto: vendi in Italia o all'estero? Hai bisogno di migrare da un altro sito? Hai già il materiale fotografico?"
  },
  {
    categoryId: 'Social Media & Marketing',
    fields: [
      { id: 'objective', label: 'Obiettivo principale', type: 'radio_group', options: ['Brand Awareness', 'Lead Generation (Contatti)', 'Vendite E-commerce', 'Crescita Follower'] },
      { id: 'channels', label: 'Su quali canali?', type: 'multiselect', options: ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Google Ads', 'Email Marketing'] },
      { id: 'content_creation', label: 'Chi crea i contenuti?', type: 'select', options: ['Li fornisco io (foto/video)', 'Mi serve anche la creazione contenuti', 'Misto (collaborazione)'] },
      { id: 'frequency', label: 'Durata collaborazione', type: 'select', options: ['Progetto Una Tantum (Setup)', 'Gestione Mensile Continuativa', 'Consulenza Strategica'] }
    ],
    budgetOptions: ['Da Stimare', '< 500€/mese', '500 - 1.000€/mese', '1.000 - 2.500€/mese', '2.500€+/mese'],
    askLocation: true,
    descriptionPlaceholder: "Descrivi il tuo target e cosa hai fatto finora. Esempio: Siamo una startup B2B, vogliamo trovare clienti su LinkedIn. Abbiamo un budget mensile per le ads escluso."
  },
  {
    categoryId: 'Branding e Grafica', // Aggiornato
    fields: [
      { id: 'deliverables', label: 'Cosa ti serve?', type: 'multiselect', options: ['Logo Design', 'Brand Identity Completa', 'Brochure/Flyer', 'Packaging', 'Presentazioni Slide', 'Social Media Kit'] },
      { id: 'style', label: 'Stile preferito', type: 'select', options: ['Minimal & Moderno', 'Lussuoso & Elegante', 'Giocoso & Colorato', 'Corporate & Serio', 'Non lo so ancora'] },
      { id: 'rebrand', label: 'È un rebranding?', type: 'radio_group', options: ['Sì, rifacimento totale', 'Sì, leggero restyling', 'No, nuovo brand da zero'] }
    ],
    budgetOptions: ['Da Stimare', '< 300€', '300 - 800€', '800 - 2.000€', '2.000€+'],
    askLocation: true,
    descriptionPlaceholder: "Racconta i valori del tuo brand. Chi sono i tuoi competitor? Hai colori che odi o che ami? A quale pubblico ti rivolgi?"
  },
  {
    categoryId: 'Sviluppo Software & App',
    fields: [
      { id: 'platform', label: 'Piattaforma target', type: 'multiselect', options: ['iOS (iPhone)', 'Android', 'Web App (Browser)', 'Desktop (Windows/Mac)'] },
      { id: 'state', label: 'Stato del progetto', type: 'select', options: ['Solo un\'idea', 'Ho le specifiche scritte', 'Ho già il design/prototipo', 'Progetto esistente da modificare'] },
      { id: 'complexity', label: 'Funzioni chiave', type: 'multiselect', options: ['Login Utenti', 'Pagamenti in-app', 'Geolocalizzazione', 'Chat/Messaggistica', 'Integrazione AI'] }
    ],
    budgetOptions: ['Da Stimare', '< 2.000€', '2.000 - 5.000€', '5.000 - 15.000€', '15.000€+'],
    askLocation: true,
    descriptionPlaceholder: "Descrivi cosa deve fare il software. Qual è il problema che risolve? Chi lo userà (dipendenti, clienti finali)? Hai scadenze precise?"
  },
  {
    categoryId: 'Video e animazioni', // Aggiornato e rinominato
    fields: [
      { id: 'type', label: 'Tipo di video', type: 'radio_group', options: ['Video Corporate/Aziendale', 'Spot Pubblicitario', 'Reels/TikTok (Short)', 'Video Animato 2D/3D', 'Editing Evento'] },
      { id: 'duration', label: 'Durata stimata', type: 'select', options: ['< 30 secondi', '1 minuto', '2-5 minuti', 'Lungo (> 10 min)'] },
      { id: 'materials', label: 'Materiale di partenza', type: 'select', options: ['Ho già il girato, serve montaggio', 'Serve girare tutto (riprese)', 'Video di stock + grafica', 'Tutto animato (no riprese)'] }
    ],
    budgetOptions: ['Da Stimare', '< 400€', '400 - 1.000€', '1.000 - 3.000€', '3.000€+'],
    askLocation: true,
    descriptionPlaceholder: "Dove verrà pubblicato il video? Qual è il messaggio chiave? Hai bisogno anche di voce narrante o attori?"
  },
  {
    categoryId: 'Fotografia',
    fields: [
      { id: 'subject', label: 'Soggetto', type: 'radio_group', options: ['Prodotti (E-commerce)', 'Evento Aziendale', 'Ritratti Business', 'Interni/Architettura', 'Food'] },
      { id: 'quantity', label: 'Numero foto finali', type: 'select', options: ['1-10', '10-30', '30-100', 'Servizio completo evento'] },
      { id: 'usage', label: 'Utilizzo principale', type: 'multiselect', options: ['Sito Web', 'Social Media', 'Stampa/Catalogo', 'Pubblicità'] }
    ],
    budgetOptions: ['Da Stimare', '< 300€', '300 - 600€', '600 - 1.200€', '1.200€+'],
    askLocation: true,
    descriptionPlaceholder: "Descrivi lo stile che cerchi (es. luce naturale, fondo bianco, ambientato). Quando serve realizzare il servizio?"
  }
];

// In-memory cache to prevent frequent fetches
let cachedContent: SiteContent = defaultContent;

export const contentService = {
  // Synchronous getter for immediate render (renders cache or default)
  getContent(): SiteContent {
    return cachedContent;
  },

  // Asynchronous fetcher to update from DB
  async fetchContent(): Promise<SiteContent> {
    try {
      const { data, error } = await supabase.from('site_content').select('content').eq('id', 1).single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "row not found"
          console.warn("Supabase: Could not fetch content (using local defaults).", error.message);
          return cachedContent;
        }
      }

      if (data && data.content) {
        const mergedContent: SiteContent = {
            ...defaultContent,
            ...data.content,
            branding: { ...defaultContent.branding, ...(data.content.branding || {}) }, // Merge branding
            auth: { 
                ...defaultContent.auth, 
                ...(data.content.auth || {}),
                register: {
                    ...defaultContent.auth.register,
                    ...(data.content.auth?.register || {})
                }
            }, 
            home: {
                ...defaultContent.home,
                ...(data.content.home || {}),
                hero: { ...defaultContent.home.hero, ...(data.content.home?.hero || {}) },
                categories: { ...defaultContent.home.categories, ...(data.content.home?.categories || {}) },
            }
        };
        
        cachedContent = mergedContent;
      } else {
        await this.saveContent(defaultContent);
      }
    } catch (e) {
      console.warn("Fetch content exception", e);
    }
    return cachedContent;
  },

  async saveContent(content: SiteContent) {
    cachedContent = content; // Update local cache immediately
    
    // NOTA: Rimuoviamo 'updated_at' dal payload per evitare errori se la colonna non esiste nel DB
    const { error } = await supabase.from('site_content').upsert({ 
      id: 1, 
      content: content
    });
    
    if (error) {
      console.error("Supabase Error saving content:", error.message);
      throw new Error(`Errore salvataggio DB: ${error.message}`);
    }
  },

  getPlans(): PricingPlan[] {
    const data = localStorage.getItem(PLANS_KEY);
    try {
        return data ? JSON.parse(data) : defaultPlans;
    } catch (e) {
        return defaultPlans;
    }
  },

  savePlans(plans: PricingPlan[]) {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  },

  getCategories(): string[] {
    const data = localStorage.getItem(CATEGORIES_KEY);
    try {
        // Se non ci sono dati o la chiave è vecchia, restituisci l'enum che contiene AI
        return data ? JSON.parse(data) : Object.values(ServiceCategory);
    } catch (e) {
        return Object.values(ServiceCategory);
    }
  },

  saveCategories(categories: string[]) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  },

  addCategory(newCat: string) {
    const cats = this.getCategories();
    if (!cats.includes(newCat)) {
      cats.push(newCat);
      this.saveCategories(cats);
      const form = this.getFormDefinition(newCat);
      this.saveFormDefinition(form);
    }
  },

  updateCategory(oldCat: string, newCat: string) {
    const cats = this.getCategories();
    const index = cats.indexOf(oldCat);
    if (index !== -1 && newCat.trim() !== '') {
      cats[index] = newCat.trim();
      this.saveCategories(cats);
      const form = this.getFormDefinition(oldCat);
      form.categoryId = newCat.trim();
      this.saveFormDefinition(form);
    }
  },

  removeCategory(cat: string) {
    const cats = this.getCategories().filter(c => c !== cat);
    this.saveCategories(cats);
  },

  getPlanDetails(id: PlanType): PricingPlan {
    return this.getPlans().find(p => p.id === id) || defaultPlans.find(p => p.id === 'FREE')!;
  },

  getFormDefinition(categoryId: string): FormDefinition {
    const data = localStorage.getItem(FORMS_KEY);
    
    // 1. Try Local Storage
    try {
        const localForms: FormDefinition[] = data ? JSON.parse(data) : [];
        const foundLocal = localForms.find(f => f.categoryId === categoryId);
        if (foundLocal) return foundLocal;
    } catch (e) {
        // Fallback
    }

    // 2. Try Default Hardcoded Forms
    const foundDefault = defaultForms.find(f => f.categoryId === categoryId);
    if (foundDefault) return foundDefault;

    // 3. Fallback generic (se la categoria è custom e non ha form)
    return {
      categoryId,
      budgetOptions: ['Da Stimare', '< 200€', '200 - 500€', '500 - 1.000€', '1.000€+'],
      askLocation: true, // Default a true per tutte le categorie custom
      descriptionPlaceholder: "Descrivi dettagliatamente cosa ti serve...",
      fields: []
    };
  },

  saveFormDefinition(definition: FormDefinition) {
    const data = localStorage.getItem(FORMS_KEY);
    let forms: FormDefinition[] = [];
    try {
        forms = data ? JSON.parse(data) : [];
    } catch(e) {}

    const index = forms.findIndex(f => f.categoryId === definition.categoryId);
    if (index !== -1) {
      forms[index] = definition;
    } else {
      forms.push(definition);
    }
    localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  }
};
