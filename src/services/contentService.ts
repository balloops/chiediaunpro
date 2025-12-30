
import { supabase } from './supabaseClient';
import { PricingPlan, SiteContent, ServiceCategory, PlanType, FormDefinition } from '../types';

const PLANS_KEY = 'chiediunpro_plans';
const CATEGORIES_KEY = 'chiediunpro_categories';
const FORMS_KEY = 'chiediunpro_forms';

const defaultContent: SiteContent = {
  branding: {
    platformName: 'ChiediUnPro',
    logoUrl: ''
  },
  home: {
    hero: {
      title: 'Trova il Pro giusto per il tuo progetto.',
      subtitle: 'Dal sito web alla strategia social: ricevi fino a 5 preventivi gratuiti dai migliori professionisti digitali in meno di 24 ore.',
      badgeText: 'La piattaforma #1 per il digital business',
      ctaPrimary: 'Chiedi un preventivo',
      ctaSecondary: 'Lavora come Pro',
      reviewScore: '4.9/5',
      reviewCount: '5.000 progetti'
    },
    stats: {
      users: '+1k',
      projects: '500+',
      rating: '4.9'
    },
    features: {
      title: 'Perché scegliere noi?',
      description: 'Velocità, qualità e sicurezza. Abbiamo ridefinito il modo di trovare esperti digitali.',
      items: [
        { title: 'Velocità Ibrida', description: 'Ricevi preventivi mirati in poche ore, non giorni.' },
        { title: 'Qualità Certificata', description: 'Verifichiamo manualmente ogni singolo professionista iscritto.' },
        { title: 'Zero Commissioni', description: 'Non paghi commissioni sui lavori trovati tramite noi.' }
      ]
    },
    cta: {
      title: 'Pronto a lanciare il tuo progetto?',
      description: 'Unisciti a migliaia di aziende e professionisti che stanno già rivoluzionando il modo di lavorare nel digitale.',
      buttonClient: 'Chiedi un preventivo',
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
      { title: "1. Descrivi il tuo progetto", description: "Compila un modulo semplice e intuitivo. L'AI ti aiuterà a definire i dettagli tecnici per ottenere preventivi precisi." },
      { title: "2. Ricevi proposte mirate", description: "In poche ore ricevi fino a 5 preventivi da professionisti qualificati e verificati, interessati al tuo lavoro." },
      { title: "3. Scegli il migliore", description: "Confronta profili, portfolio e prezzi. Scegli il Pro giusto e inizia a collaborare senza commissioni aggiuntive." }
    ],
    proSteps: [
      { title: "1. Crea il tuo profilo Pro", description: "Registrati gratuitamente, inserisci le tue competenze, il portfolio e definisci i tuoi servizi digitali." },
      { title: "2. Trova nuovi clienti", description: "Accedi a una bacheca di opportunità filtrate in base alle tue skills. Niente più ricerca a freddo." },
      { title: "3. Invia preventivi e vinci", description: "Usa i tuoi crediti per rispondere alle richieste. Se il cliente ti sceglie, il lavoro è tutto tuo." }
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
        answer: "Assolutamente sì. Pubblicare una richiesta su ChiediUnPro è completamente gratuito per i clienti.",
        category: 'general'
      },
      {
        question: "Come scelgo il professionista giusto?",
        answer: "Guarda il portfolio, le recensioni e l'esperienza. Confronta i preventivi sulla qualità, non solo sul prezzo.",
        category: 'trust'
      },
      {
        question: "I professionisti sono verificati?",
        answer: "Sì, verifichiamo manualmente ogni professionista. Badge 'Verificato' significa documentazione validata.",
        category: 'trust'
      },
      {
        question: "Come funzionano i Crediti?",
        answer: "I crediti servono per inviare preventivi. Il piano FREE ne include 3/mese, PRO 20/mese.",
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
    name: 'Starter',
    price: 0,
    credits: 3,
    features: ['3 Preventivi/mese', 'Profilo Base', 'Supporto Email'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 29,
    credits: 20,
    features: ['20 Preventivi/mese', 'Profilo in Evidenza', 'Badge "Verificato"', 'Supporto Prioritario'],
    isPopular: true,
  },
  {
    id: 'AGENCY',
    name: 'Agency',
    price: 99,
    credits: 'UNLIMITED',
    features: ['Preventivi Illimitati', 'Multi-account', 'API Access', 'Account Manager Dedicato'],
  }
];

// --- FORM DEFINITIONS ---
const defaultForms: FormDefinition[] = [
  {
    categoryId: ServiceCategory.WEBSITE, // Sito Web
    descriptionPlaceholder: "Es. Ho bisogno di un sito vetrina per il mio studio legale con 5 pagine e un form di contatto...",
    askLocation: true,
    budgetOptions: ['< 500€', '500 - 1.500€', '1.500 - 3.000€', '3.000€+'],
    fields: [
      {
        id: 'website_type',
        label: 'Che tipo di sito hai in mente?',
        type: 'select',
        options: ['Sito Vetrina', 'Landing Page', 'Blog / Magazine', 'Portale Complesso', 'Altro'],
        required: true
      },
      {
        id: 'content_ready',
        label: 'Hai già i contenuti (testi/foto)?',
        type: 'radio_group',
        options: ['Sì, pronti', 'No, da creare'],
        required: true
      },
      {
        id: 'features',
        label: 'Funzionalità Extra',
        type: 'checkbox_group',
        options: ['Newsletter', 'Pagamenti', 'Prenotazioni', 'SEO Pro', 'Social Feed', 'Multilingua'],
        required: false
      }
    ]
  },
  {
    categoryId: ServiceCategory.ECOMMERCE, // E-commerce
    descriptionPlaceholder: "Es. Voglio vendere prodotti artigianali in pelle, circa 50 referenze, spedizioni in tutta Italia...",
    askLocation: false, // Spesso remoto
    budgetOptions: ['< 1.000€', '1.000 - 3.000€', '3.000 - 10.000€', '10.000€+'],
    fields: [
      {
        id: 'platform',
        label: 'Piattaforma Preferita',
        type: 'select',
        options: ['Shopify', 'WooCommerce (WordPress)', 'Magento', 'PrestaShop', 'Custom', 'Consigliami tu'],
        required: true
      },
      {
        id: 'product_count',
        label: 'Numero di prodotti stimato',
        type: 'select',
        options: ['1 - 10', '10 - 100', '100 - 1.000', '1.000+'],
        required: true
      }
    ]
  },
  {
    categoryId: ServiceCategory.MARKETING, // Social Media & Marketing
    descriptionPlaceholder: "Es. Cerco un Social Media Manager per gestire Instagram e LinkedIn della mia azienda, 3 post a settimana...",
    askLocation: false,
    budgetOptions: ['< 300€/mese', '300 - 800€/mese', '800 - 2.000€/mese', 'Budget a progetto'],
    fields: [
      {
        id: 'platforms',
        label: 'Quali piattaforme vuoi gestire?',
        type: 'multiselect',
        options: ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'Google Ads'],
        required: true
      },
      {
        id: 'goals',
        label: 'Obiettivo Principale',
        type: 'select',
        options: ['Brand Awareness', 'Lead Generation (Contatti)', 'Vendite Dirette', 'Community Management'],
        required: true
      }
    ]
  },
  {
    categoryId: ServiceCategory.DESIGN, // UX/UI Design
    descriptionPlaceholder: "Es. Ho bisogno di ridisegnare l'interfaccia della mia app iOS per renderla più moderna...",
    askLocation: false,
    budgetOptions: ['< 500€', '500 - 2.000€', '2.000 - 5.000€', '5.000€+'],
    fields: [
      {
        id: 'design_scope',
        label: 'Cosa devi progettare?',
        type: 'select',
        options: ['App Mobile', 'Sito Web', 'Dashboard / SaaS', 'Logo & Brand', 'Altro'],
        required: true
      },
      {
        id: 'deliverables',
        label: 'Cosa ti serve?',
        type: 'checkbox_group',
        options: ['Wireframes', 'Prototipo Interattivo', 'Design System', 'User Research'],
        required: false
      }
    ]
  },
  {
    categoryId: ServiceCategory.SOFTWARE, // Sviluppo Software & App
    descriptionPlaceholder: "Es. Vorrei creare un'app gestionale per il mio magazzino che funzioni su iPad...",
    askLocation: false,
    budgetOptions: ['< 2.000€', '2.000 - 5.000€', '5.000 - 15.000€', '15.000€+'],
    fields: [
      {
        id: 'app_type',
        label: 'Tipologia Progetto',
        type: 'select',
        options: ['App Mobile (iOS/Android)', 'Web App / SaaS', 'Software Desktop', 'Script / Automazione'],
        required: true
      },
      {
        id: 'project_stage',
        label: 'Stato del progetto',
        type: 'radio_group',
        options: ['Solo Idea', 'Specifica Pronta', 'Progetto da Aggiornare'],
        required: true
      }
    ]
  },
  {
    categoryId: ServiceCategory.AI, // Intelligenza Artificiale
    descriptionPlaceholder: "Es. Vorrei integrare un assistente virtuale sul mio sito ecommerce per rispondere alle domande frequenti...",
    askLocation: false,
    budgetOptions: ['< 1.000€', '1.000 - 5.000€', '5.000 - 15.000€', '15.000€+'],
    fields: [
      {
        id: 'ai_type',
        label: 'Tipo di Soluzione',
        type: 'select',
        options: ['Chatbot & Assistenti Virtuali', 'Automazione Processi (RPA)', 'Machine Learning / Predizioni', 'Generazione Contenuti (Testo/Img)', 'Consulenza Strategica AI', 'Altro'],
        required: true
      },
      {
        id: 'integration',
        label: 'Integrazione Richiesta',
        type: 'checkbox_group',
        options: ['Sito Web', 'WhatsApp / Telegram', 'Software Gestionale (ERP/CRM)', 'App Mobile', 'Nessuna / Standalone'],
        required: false
      }
    ]
  },
  {
    categoryId: ServiceCategory.BRANDING, // Branding & Grafica
    descriptionPlaceholder: "Es. Sto aprendo un ristorante e mi serve logo, menu e biglietti da visita...",
    askLocation: true,
    budgetOptions: ['< 300€', '300 - 1.000€', '1.000 - 3.000€', '3.000€+'],
    fields: [
      {
        id: 'branding_needs',
        label: 'Di cosa hai bisogno?',
        type: 'multiselect',
        options: ['Logo Design', 'Immagine Coordinata', 'Rebranding', 'Materiale Stampa', 'Packaging'],
        required: true
      }
    ]
  },
  {
    categoryId: ServiceCategory.PHOTOGRAPHY, // Fotografia
    descriptionPlaceholder: "Es. Servizio fotografico per i piatti del mio nuovo menu...",
    askLocation: true,
    budgetOptions: ['< 200€', '200 - 500€', '500 - 1.500€', '1.500€+'],
    fields: [
      {
        id: 'photo_type',
        label: 'Tipo di servizio',
        type: 'select',
        options: ['Eventi', 'Prodotti / E-commerce', 'Ritratti / Corporate', 'Immobiliare', 'Cibo / Ristorazione'],
        required: true
      }
    ]
  },
  {
    categoryId: ServiceCategory.VIDEO, // Video
    descriptionPlaceholder: "Es. Video promozionale di 30 secondi per Instagram...",
    askLocation: true,
    budgetOptions: ['< 300€', '300 - 1.000€', '1.000 - 3.000€', '3.000€+'],
    fields: [
      {
        id: 'video_type',
        label: 'Tipo di Video',
        type: 'select',
        options: ['Spot Pubblicitario', 'Video Corporate', 'Riprese Evento', 'Animazione / Motion Graphics', 'Montaggio / Editing'],
        required: true
      }
    ]
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
          // Avoid noise if table doesn't exist
          console.warn("Supabase: Could not fetch content (using local defaults).", error.message);
          return cachedContent;
        }
        // If row not found (PGRST116), we try to seed, but handle error gracefully
      }

      if (data && data.content) {
        // Merge to ensure new fields are present if DB is outdated structure
        cachedContent = { ...defaultContent, ...data.content };
      } else {
        // DB is empty or row missing, seed it with defaults
        await this.saveContent(defaultContent);
      }
    } catch (e) {
      console.warn("Fetch content exception", e);
    }
    return cachedContent;
  },

  async saveContent(content: SiteContent) {
    cachedContent = content;
    const { error } = await supabase.from('site_content').upsert({ 
      id: 1, 
      content: content,
      updated_at: new Date().toISOString()
    });
    
    if (error) {
      console.warn("Supabase Warning: Error saving content (DB might be missing 'site_content' table):", error.message || error);
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

    // 3. Fallback generic
    return {
      categoryId,
      budgetOptions: ['< 500€', '500 - 2k€', '2k - 5k€', '5k€+'],
      askLocation: true,
      descriptionPlaceholder: "Descrivi il tuo progetto qui...",
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