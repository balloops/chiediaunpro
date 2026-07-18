
export const BANDO_REGIONS = [
  'Nazionale',
  'Lombardia',
  'Lazio',
  'Piemonte',
  'Veneto',
  'Campania',
  'Emilia-Romagna',
] as const;

export const BANDO_CATEGORIES = [
  'Siti web & E-commerce',
  'Software & Cloud',
  'Cybersecurity',
  'Formazione digitale',
  'Automazione processi',
] as const;

export interface Bando {
  id: string;
  title: string;
  region: typeof BANDO_REGIONS[number];
  categories: (typeof BANDO_CATEGORIES[number])[];
  amountLabel: string;
  description: string;
  requirements: string[];
  officialUrl: string;
  officialUrlLabel: string;
  lastVerifiedAt: string; // ISO date — mostrato come "verificato al"
}

export const BANDI: Bando[] = [
  {
    id: 'pid-doppia-transizione',
    title: 'Voucher Doppia Transizione (rete nazionale PID)',
    region: 'Nazionale',
    categories: ['Software & Cloud', 'Formazione digitale', 'Cybersecurity', 'Automazione processi'],
    amountLabel: 'Fino al 70% delle spese a fondo perduto',
    description: 'Programma promosso dai Punti Impresa Digitale delle Camere di Commercio con Unioncamere: 150 milioni di euro per il triennio 2026-2029, focus su intelligenza artificiale e transizione ecologica oltre che digitale.',
    requirements: [
      'Impresa attiva e iscritta al Registro Imprese, DURC regolare',
      'Valutazione di maturità digitale gratuita sul portale PID nei 3 mesi precedenti la domanda',
      'La Camera di Commercio territoriale deve aderire al bando nazionale (non tutte partecipano)',
    ],
    officialUrl: 'https://www.puntoimpresadigitale.camcom.it/',
    officialUrlLabel: 'Punto Impresa Digitale — portale ufficiale',
    lastVerifiedAt: '2026-07-18',
  },
  {
    id: 'lombardia-voucher-digitali-4-0',
    title: 'Voucher Digitali 4.0 Lombardia',
    region: 'Lombardia',
    categories: ['Software & Cloud', 'Cybersecurity', 'Siti web & E-commerce'],
    amountLabel: 'Fino a 10.000€ (50% delle spese)',
    description: 'Contributo a fondo perduto per micro, piccole e medie imprese lombarde che adottano tecnologie digitali avanzate (AI, cybersecurity, ERP/CRM, cloud, IoT).',
    requirements: [
      'Unità produttiva attiva iscritta a una Camera di Commercio lombarda',
      'Sede legale in Lombardia',
      'Investimento minimo 4.000€',
    ],
    officialUrl: 'https://www.unioncamerelombardia.it/bandi-e-incentivi-alle-imprese',
    officialUrlLabel: 'Unioncamere Lombardia — bandi e incentivi',
    lastVerifiedAt: '2026-07-18',
  },
  {
    id: 'lazio-voucher-digitalizzazione-pmi',
    title: 'Voucher Digitalizzazione PMI — Regione Lazio',
    region: 'Lazio',
    categories: ['Software & Cloud', 'Cybersecurity', 'Siti web & E-commerce', 'Automazione processi'],
    amountLabel: 'Fino a 50.000€ (micro) / 100.000€ (piccole) / 150.000€ (medie imprese)',
    description: 'Incentivi per l\'adozione di soluzioni digitali (gestionali, cloud, cybersecurity, e-commerce, automazione dei processi) da parte delle PMI del Lazio, con massimali crescenti in base alla dimensione aziendale.',
    requirements: [
      'PMI con sede operativa nel Lazio',
      'Massimali differenziati per fascia dimensionale',
    ],
    officialUrl: 'https://fesr.regione.lazio.it/',
    officialUrlLabel: 'Regione Lazio — FESR, Voucher Digitalizzazione PMI',
    lastVerifiedAt: '2026-07-18',
  },
  {
    id: 'piemonte-transizione-digitale',
    title: 'Misura regionale per la transizione digitale — Piemonte',
    region: 'Piemonte',
    categories: ['Software & Cloud', 'Siti web & E-commerce'],
    amountLabel: 'Importi in definizione (misura approvata nel 2026)',
    description: 'Nuova misura regionale per sostenere la transizione digitale del sistema imprenditoriale piemontese, approvata con delibera nel 2026. Dettagli su importi e spese ammissibili ancora in fase di pubblicazione al momento della verifica.',
    requirements: [
      'Dettagli non ancora completi — verificare direttamente sul portale regionale prima di procedere',
    ],
    officialUrl: 'https://bandi.regione.piemonte.it/',
    officialUrlLabel: 'Regione Piemonte — portale bandi',
    lastVerifiedAt: '2026-07-18',
  },
  {
    id: 'veneto-fondo-competitivita-transizione',
    title: 'Fondo Veneto Competitività — Sezione Transizione',
    region: 'Veneto',
    categories: ['Software & Cloud', 'Siti web & E-commerce', 'Formazione digitale'],
    amountLabel: 'Contributi a fondo perduto, importi variabili per misura (indicativamente 6.000-10.000€ per i voucher PMI)',
    description: 'Strumento della Regione Veneto (PR FESR 2021-2027, dotazione 70 milioni di euro) per programmi di Transizione 4.0, economia circolare e tecnologie avanzate. Include voucher per digitalizzazione, e-commerce, banda larga e formazione ICT del personale.',
    requirements: [
      'Micro, piccole e medie imprese venete',
      'Importi e soglie variano tra le diverse misure attive — verificare quale si applica al proprio caso',
    ],
    officialUrl: 'https://bandi.contributiregione.it/regione/veneto',
    officialUrlLabel: 'Bandi attivi in Regione Veneto',
    lastVerifiedAt: '2026-07-18',
  },
  {
    id: 'campania-voucher-digitalizzazione',
    title: 'Voucher Digitalizzazione — Regione Campania',
    region: 'Campania',
    categories: ['Software & Cloud', 'Siti web & E-commerce'],
    amountLabel: 'Fino a 25.000€ (60% delle spese)',
    description: 'Programma da 150 milioni di euro per PMI e autonomi campani, per l\'acquisto di software, hardware e servizi specialistici di digitalizzazione, incluse soluzioni e-commerce e connettività a banda larga.',
    requirements: [
      'PMI o lavoratore autonomo con sede in Campania',
      'Finestre di adesione a scaglioni — verificare il calendario aggiornato',
    ],
    officialUrl: 'https://www.claaicampania.it/voucher-digitalizzazione-150-milioni-per-pmi-e-autonomi/',
    officialUrlLabel: 'Approfondimento sul bando Campania',
    lastVerifiedAt: '2026-07-18',
  },
  {
    id: 'emilia-romagna-innovazione-digitale',
    title: 'Bando Innovazione Digitale — Camera di Commercio dell\'Emilia',
    region: 'Emilia-Romagna',
    categories: ['Software & Cloud', 'Cybersecurity', 'Automazione processi'],
    amountLabel: 'Fino a 10.000€ (50% delle spese); altre misure regionali arrivano a 30.000€',
    description: 'La Camera di Commercio dell\'Emilia finanzia progetti di innovazione digitale per le PMI del territorio. Esistono inoltre bandi paralleli (es. Camera di Commercio di Bologna, "transizione digitale") con massimali diversi: vale la pena controllare quale Camera di Commercio è competente per la propria sede.',
    requirements: [
      'PMI con sede nel territorio della Camera di Commercio che pubblica il bando',
      'Massimali e requisiti diversi tra le varie Camere di Commercio dell\'Emilia-Romagna',
    ],
    officialUrl: 'https://www.emilia.camcom.it/promuovere-limpresa-e-il-territorio/contributi-alle-imprese/bando-innovazione-digitale-2026-pi26',
    officialUrlLabel: 'Camera di Commercio dell\'Emilia — Bando Innovazione Digitale',
    lastVerifiedAt: '2026-07-18',
  },
];
