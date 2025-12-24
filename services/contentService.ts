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
    name: 'Free Starter', 
    price: 0, 
    credits: 3, 
    features: ['Profilo Pro Base', 'Accesso Lead Standard', 'Supporto Community'] 
  },
  { 
    id: 'PRO', 
    name: 'Professional', 
    price: 29, 
    credits: 20, 
    features: ['Badge Pro Verificato', 'Miglioramento AI', 'Lead Prioritari', 'Statistiche Avanzate'],
    isPopular: true
  },
  { 
    id: 'AGENCY', 
    name: 'Digital Agency', 
    price: 89, 
    credits: 'UNLIMITED', 
    features: ['Multi-account', 'Analisi Concorrenza', 'Manager Dedicato', 'Lead Exclusive'] 
  }
];

const defaultForms: FormDefinition[] = [
  {
    categoryId: ServiceCategory.WEBSITE,
    budgetOptions: ['< 500€', '500 - 2k€', '2k - 5k€', '5k€+'],
    askLocation: true,
    descriptionPlaceholder: "Descrivi il tuo sito web ideale...",
    fields: [
      {
        id: 'siteType',
        label: 'Che tipo di sito hai in mente?',
        type: 'select',
        options: ['Landing Page', 'Sito Vetrina', 'E-commerce', 'Blog / Magazine'],
        required: true
      },
      {
        id: 'contentReady',
        label: 'Hai già i contenuti (Testi/Foto)?',
        type: 'checkbox_group',
        options: ['Sì, pronti', 'No, da creare']
      },
      {
        id: 'integrations',
        label: 'Funzionalità Extra',
        type: 'multiselect',
        options: ['Newsletter', 'Pagamenti', 'Prenotazioni', 'SEO Pro', 'Social Feed', 'Multilingua']
      }
    ]
  },
  {
    categoryId: ServiceCategory.ECOMMERCE,
    budgetOptions: ['1k - 3k€', '3k - 10k€', '10k€+'],
    askLocation: false,
    descriptionPlaceholder: "Cosa vuoi vendere online?",
    fields: [
      {
        id: 'platform',
        label: 'Piattaforma Preferita',
        type: 'select',
        options: ['Shopify', 'WooCommerce', 'Magento', 'Custom', 'Consigliami tu']
      },
      {
        id: 'productCount',
        label: 'Numero di prodotti stimato',
        type: 'select',
        options: ['1 - 10', '10 - 100', '100 - 500', '500+']
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
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "row not found"
        console.error("Error fetching content:", error);
        return cachedContent;
      }

      if (data && data.content) {
        // Merge to ensure new fields are present if DB is outdated structure
        cachedContent = { ...defaultContent, ...data.content };
      } else {
        // DB is empty, seed it with defaults
        await this.saveContent(defaultContent);
      }
    } catch (e) {
      console.error("Fetch content exception", e);
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
    
    if (error) console.error("Error saving content:", error);
  },

  getPlans(): PricingPlan[] {
    const data = localStorage.getItem(PLANS_KEY);
    return data ? JSON.parse(data) : defaultPlans;
  },

  savePlans(plans: PricingPlan[]) {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  },

  getCategories(): string[] {
    const data = localStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : Object.values(ServiceCategory);
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
    const forms: FormDefinition[] = data ? JSON.parse(data) : defaultForms;
    const found = forms.find(f => f.categoryId === categoryId);
    if (found) return found;
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
    const forms: FormDefinition[] = data ? JSON.parse(data) : defaultForms;
    const index = forms.findIndex(f => f.categoryId === definition.categoryId);
    if (index !== -1) {
      forms[index] = definition;
    } else {
      forms.push(definition);
    }
    localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  }
};