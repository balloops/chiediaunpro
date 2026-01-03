
import { supabase } from './supabaseClient';
import { PricingPlan, SiteContent, ServiceCategory, PlanType, FormDefinition } from '../types';

// CAMBIO CHIAVI PER FORZARE IL RESET DELLA CACHE LOCALE
const PLANS_KEY = 'lavorabene_plans_v1';
const CATEGORIES_KEY = 'lavorabene_categories_v1';
const FORMS_KEY = 'lavorabene_forms_v1';

const defaultContent: SiteContent = {
  branding: {
    platformName: 'LavoraBene',
    logoUrl: '',
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
      title: 'Trova il Pro giusto per il tuo progetto.',
      subtitle: 'Dal sito web alla strategia social: ricevi fino a 5 proposte gratuite dai migliori professionisti digitali in meno di 24 ore.',
      badgeText: 'La piattaforma #1 per il digital business',
      ctaPrimary: 'Chiedi una proposta',
      ctaSecondary: 'Lavora come Pro',
      reviewScore: '4.9/5',
      reviewCount: '5.000 progetti',
      reviewText: 'media recensioni su oltre',
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
      buttonClient: 'Chiedi una proposta',
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
      { title: "1. Descrivi il tuo progetto", description: "Compila un modulo semplice e intuitivo. L'AI ti aiuterà a definire i dettagli tecnici per ottenere proposte precise." },
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
    categoryId: 'Sito Web',
    fields: [
      { id: 'pages', label: 'Numero di pagine', type: 'select', options: ['1 (Landing Page)', '2-5', '6-10', '10+'] },
      { id: 'features', label: 'Funzionalità richieste', type: 'multiselect', options: ['Blog', 'Multilingua', 'Area riservata', 'Integrazioni API'] }
    ],
    budgetOptions: ['< 500€', '500 - 1.500€', '1.500 - 3.000€', '3.000€+'],
    askLocation: false,
    descriptionPlaceholder: "Descrivi il tuo progetto web ideale..."
  },
  {
    categoryId: 'E-commerce',
    fields: [
      { id: 'products', label: 'Numero prodotti', type: 'select', options: ['1-10', '11-50', '50-100', '100+'] },
      { id: 'platform', label: 'Piattaforma preferita', type: 'select', options: ['Shopify', 'WooCommerce', 'PrestaShop', 'Custom', 'Non so'] }
    ],
    budgetOptions: ['< 1.000€', '1.000 - 3.000€', '3.000 - 5.000€', '5.000€+'],
    askLocation: false,
    descriptionPlaceholder: "Descrivi cosa vuoi vendere e a chi..."
  },
  {
    categoryId: 'Social Media & Marketing',
    fields: [
      { id: 'channels', label: 'Canali social', type: 'multiselect', options: ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube'] },
      { id: 'goal', label: 'Obiettivo principale', type: 'radio_group', options: ['Brand Awareness', 'Lead Generation', 'Vendite dirette', 'Crescita Follower'] }
    ],
    budgetOptions: ['< 500€/mese', '500 - 1.000€/mese', '1.000 - 2.500€/mese', '2.500€+/mese'],
    askLocation: false,
    descriptionPlaceholder: "Descrivi la tua strategia attuale e gli obiettivi futuri..."
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
        // Deep merge to ensure new fields (like 'ratingLabel') are present even if DB data is old
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
            }, // Merge auth deep
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
