
export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'links'; items: { label: string; url: string }[] };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string; // ISO date
  relatedServiceSlug?: string; // collega alla landing /service/:slug pertinente
  published: boolean; // finché false, il post non compare su /blog né in sitemap
  body: BlogBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'quanto-costa-sito-web',
    title: 'Quanto costa un sito web nel 2026? Guida pratica ai prezzi in Italia',
    excerpt: 'I fattori che determinano davvero il prezzo di un sito web: tipo di progetto, competenze coinvolte, contenuti e manutenzione.',
    publishedAt: '2026-07-16',
    relatedServiceSlug: 'sito-web',
    published: true,
    body: [
      { type: 'p', text: 'È una delle domande più comuni di chi si affaccia per la prima volta alla realizzazione di un sito web: quanto costa? La risposta onesta è "dipende", ma i fattori che fanno variare il prezzo sono pochi e riconoscibili. Vediamoli uno per uno.' },
      { type: 'h2', text: 'Il tipo di sito conta più di tutto' },
      { type: 'p', text: 'Un sito vetrina di poche pagine, con contenuti statici e nessuna funzionalità particolare, richiede molto meno lavoro di un e-commerce con gestione magazzino, pagamenti e spedizioni, o di una web app con funzionalità su misura. Prima di chiedere un preventivo, è utile avere chiaro cosa serve davvero al progetto: spesso si parte chiedendo "un sito" quando in realtà si ha bisogno di qualcosa di molto più specifico (o molto più semplice).' },
      { type: 'h2', text: 'Freelance o agenzia?' },
      { type: 'p', text: 'Un professionista freelance ha in genere costi di struttura più bassi di un\'agenzia con più persone coinvolte (project manager, designer, sviluppatore, copywriter), e questo si riflette sul preventivo. Non significa che una scelta sia sempre migliore dell\'altra: un\'agenzia offre più garanzie di continuità e competenze diverse sotto lo stesso tetto, un freelance spesso più flessibilità e un rapporto diretto. La scelta dipende dalla complessità del progetto e da quanto supporto serve nel tempo.' },
      { type: 'h2', text: 'Cosa è incluso (e cosa no)' },
      { type: 'p', text: 'Due preventivi apparentemente simili possono nascondere perimetri molto diversi. Prima di confrontare i prezzi, verifica sempre cosa è incluso:' },
      { type: 'list', items: [
        'Design personalizzato o template pre-esistente adattato',
        'Copywriting dei testi, o li fornisci tu',
        'Ottimizzazione SEO di base (title, meta description, struttura URL)',
        'Formazione per gestire autonomamente i contenuti dopo il lancio',
        'Assistenza e aggiornamenti nei mesi successivi alla pubblicazione',
      ] },
      { type: 'h2', text: 'I costi ricorrenti da non dimenticare' },
      { type: 'p', text: 'Al costo di realizzazione si aggiungono spese che continuano nel tempo: dominio (di solito rinnovo annuale), hosting, eventuale manutenzione o aggiornamenti di sicurezza. Un preventivo serio dovrebbe rendere chiari questi costi fin dall\'inizio, non farli emergere dopo.' },
      { type: 'h2', text: 'Come muoversi in pratica' },
      { type: 'p', text: 'Il modo più affidabile per capire quanto costerà davvero il tuo progetto è descriverlo con qualche dettaglio in più (numero di pagine indicativo, funzionalità necessarie, se hai già contenuti e immagini pronti) e ricevere più proposte da confrontare, invece di basarti su una cifra generica trovata online. Su LavoraBene puoi pubblicare la richiesta gratuitamente e ricevere preventivi da professionisti verificati, senza impegno.' },
    ],
  },
  {
    slug: 'come-scegliere-professionista-digitale',
    title: 'Come scegliere il professionista giusto per il tuo progetto digitale: 7 domande da fare prima di ingaggiare qualcuno',
    excerpt: 'Una checklist pratica per valutare portfolio, tempistiche e condizioni prima di affidare un progetto a un professionista.',
    publishedAt: '2026-07-16',
    published: true,
    body: [
      { type: 'p', text: 'Che si tratti di un sito web, una campagna social o un\'identità di brand, scegliere la persona giusta a cui affidare il progetto conta quanto (o più) del budget a disposizione. Ecco sette domande concrete da porre prima di dire sì a un preventivo.' },
      { type: 'h2', text: '1. Posso vedere lavori simili al mio?' },
      { type: 'p', text: 'Un portfolio generico non basta: chiedi esempi di progetti con esigenze paragonabili alle tue, per settore o per tipo di lavoro richiesto.' },
      { type: 'h2', text: '2. Quali sono i tempi realistici?' },
      { type: 'p', text: 'Diffida di tempistiche troppo ottimistiche senza una spiegazione di come verranno rispettate. Chiedi tappe intermedie verificabili, non solo una data di consegna finale.' },
      { type: 'h2', text: '3. Quante revisioni sono incluse?' },
      { type: 'p', text: 'Molti conflitti nascono da aspettative diverse sul numero di modifiche incluse nel prezzo. Chiarirlo prima evita sorprese (e costi extra) dopo.' },
      { type: 'h2', text: '4. A chi appartengono i file sorgente?' },
      { type: 'p', text: 'Al termine del lavoro, hai diritto ai file editabili (codice sorgente, file grafici originali) o solo al prodotto finito? È una domanda spesso trascurata che può costare cara in futuro, se vorrai cambiare fornitore.' },
      { type: 'h2', text: '5. Cosa succede dopo la consegna?' },
      { type: 'p', text: 'Assistenza post-lancio, correzioni di bug, aggiornamenti: capisci se sono inclusi, per quanto tempo, e cosa costa andare oltre.' },
      { type: 'h2', text: '6. Come comunicheremo durante il progetto?' },
      { type: 'p', text: 'Email, chat, chiamate periodiche: allineare le aspettative su frequenza e canale di comunicazione riduce fraintendimenti, soprattutto su progetti che durano settimane.' },
      { type: 'h2', text: '7. Puoi mostrarmi recensioni o referenze verificabili?' },
      { type: 'p', text: 'Le referenze dirette (non solo testimonianze scritte sul sito del professionista) aiutano a farsi un\'idea più affidabile di come lavora davvero.' },
      { type: 'h2', text: 'In sintesi' },
      { type: 'p', text: 'Non esiste una risposta valida per tutti: la scelta giusta dipende dal tuo progetto specifico. Porre queste domande fin dall\'inizio, però, aiuta a confrontare i preventivi su basi eque e a evitare le sorprese più comuni. Su LavoraBene ogni professionista è consultabile con il proprio profilo: pubblica la tua richiesta e confronta le proposte con calma.' },
    ],
  },
  {
    slug: 'quanto-costa-ecommerce',
    title: 'Aprire un e-commerce: quanto costa davvero (piattaforma, sviluppo, marketing)',
    excerpt: 'Le voci di spesa reali per lanciare un negozio online, dalla scelta della piattaforma al marketing di lancio.',
    publishedAt: '2026-07-16',
    relatedServiceSlug: 'ecommerce',
    published: true,
    body: [
      { type: 'p', text: 'Aprire un e-commerce sembra oggi più accessibile che mai, ma il costo totale del progetto va spesso oltre la sola realizzazione del sito. Ecco le voci principali da considerare per farsi un\'idea realistica.' },
      { type: 'h2', text: 'La piattaforma' },
      { type: 'p', text: 'Shopify, WooCommerce, PrestaShop e altre soluzioni hanno modelli di costo diversi: alcune richiedono un canone mensile fisso, altre sono gratuite ma necessitano di hosting e manutenzione separati. La scelta dipende da quanto vuoi personalizzare il negozio e da quante competenze tecniche hai a disposizione internamente.' },
      { type: 'h2', text: 'Sviluppo e personalizzazione' },
      { type: 'p', text: 'Un tema pronto configurato da un professionista costa meno di un progetto grafico e funzionale completamente su misura. Le funzionalità che fanno crescere il costo includono: integrazioni con gestionali esistenti, filtri di ricerca avanzati, configuratori di prodotto, multi-lingua o multi-valuta.' },
      { type: 'h2', text: 'Pagamenti e logistica' },
      { type: 'p', text: 'I gateway di pagamento applicano commissioni per transazione (in genere una percentuale più una quota fissa). A questo si aggiungono i costi di spedizione e, se previsti, di gestione resi: voci spesso sottovalutate in fase di preventivo iniziale.' },
      { type: 'h2', text: 'Il marketing di lancio' },
      { type: 'p', text: 'Un e-commerce online non genera traffico da solo. Che si tratti di SEO, campagne a pagamento o social media, va messo in conto un budget (e del tempo) per far conoscere il negozio, separato dal costo di realizzazione del sito.' },
      { type: 'h2', text: 'Come farsi un\'idea realistica' },
      { type: 'p', text: 'Invece di partire da una cifra letta online, conviene descrivere il progetto (numero indicativo di prodotti, funzionalità necessarie, se serve integrazione con sistemi esistenti) e confrontare più preventivi che coprano esplicitamente tutte queste voci. Su LavoraBene puoi farlo gratuitamente, ricevendo proposte da professionisti specializzati in e-commerce.' },
    ],
  },
  {
    slug: 'prezzo-logo-brand-identity',
    title: 'Quanto costa un logo e la brand identity: cosa influenza il prezzo',
    excerpt: 'Dalla semplicità del logo alle linee guida di brand: i fattori che spiegano perché due preventivi possono essere molto diversi.',
    publishedAt: '2026-07-16',
    relatedServiceSlug: 'logo-branding',
    published: true,
    body: [
      { type: 'p', text: 'Un logo può costare poche decine di euro su una piattaforma automatizzata, oppure diverse migliaia se fa parte di un progetto di brand identity completo. La differenza sta in cosa viene effettivamente realizzato e nel processo che porta al risultato finale.' },
      { type: 'h2', text: 'Solo logo, o identità completa?' },
      { type: 'p', text: 'Un conto è un simbolo grafico isolato, un altro è un sistema coerente che comprende palette colori, font, applicazioni su materiali diversi (biglietti da visita, packaging, social) e linee guida che garantiscono coerenza nel tempo. Chiarire fin da subito cosa serve davvero evita di pagare per qualcosa di sovradimensionato, o di ritrovarsi con un logo isolato che non si integra bene altrove.' },
      { type: 'h2', text: 'Il processo creativo dietro il prezzo' },
      { type: 'p', text: 'Un designer esperto non parte disegnando: prima raccoglie informazioni sul brand, il pubblico di riferimento, i competitor. Questo lavoro di ricerca, insieme al numero di concept proposti e di revisioni incluse, incide sul prezzo tanto quanto il risultato grafico finale.' },
      { type: 'h2', text: 'Cosa dovresti ricevere alla fine' },
      { type: 'list', items: [
        'File vettoriali editabili (non solo immagini in formato png o jpg)',
        'Versioni per usi diversi (positivo, negativo, monocromatico)',
        'Indicazioni su font e colori (codici esatti, non solo "esempi visivi")',
        'Linee guida di base, se il progetto include la brand identity completa',
      ] },
      { type: 'h2', text: 'Perché il prezzo più basso non è sempre il più conveniente' },
      { type: 'p', text: 'Un logo economico realizzato senza un processo alle spalle rischia di dover essere rifatto entro pochi anni, quando l\'attività cresce o cambia posizionamento. Vale la pena valutare il preventivo anche in base a quanto è pensato per durare, non solo al costo iniziale.' },
      { type: 'h2', text: 'Come procedere' },
      { type: 'p', text: 'Descrivi il tuo progetto (logo isolato o identità completa, settore, riferimenti visivi che ti piacciono) e confronta le proposte di più designer su LavoraBene, gratuitamente e senza impegno.' },
    ],
  },
  {
    slug: 'social-media-manager-quanto-costa',
    title: 'Social Media Manager: quanto costa e cosa include un servizio professionale',
    excerpt: 'Cosa cambia tra la gestione base dei social e un servizio completo con campagne a pagamento e reportistica.',
    publishedAt: '2026-07-16',
    relatedServiceSlug: 'social-media',
    published: true,
    body: [
      { type: 'p', text: 'Affidare i social media a un professionista può significare cose molto diverse a seconda del servizio scelto. Capire cosa è incluso aiuta a valutare un preventivo in modo più consapevole.' },
      { type: 'h2', text: 'Numero di canali e frequenza' },
      { type: 'p', text: 'Gestire un solo canale con due pubblicazioni a settimana richiede un impegno molto diverso rispetto a coordinare Instagram, Facebook e LinkedIn con contenuti quotidiani. Il numero di canali e la cadenza di pubblicazione sono tra i primi fattori che determinano il prezzo.' },
      { type: 'h2', text: 'Solo contenuti, o anche campagne a pagamento?' },
      { type: 'p', text: 'La gestione organica (piano editoriale, creazione contenuti, pubblicazione) è un servizio diverso dalla gestione delle campagne pubblicitarie (Meta Ads, LinkedIn Ads), che richiede competenze specifiche di impostazione, ottimizzazione e controllo del budget. Alcuni professionisti offrono entrambe, altri sono specializzati solo in una delle due.' },
      { type: 'h2', text: 'Chi crea i contenuti visivi' },
      { type: 'p', text: 'Foto e video professionali hanno un costo (e un tempo di produzione) diverso rispetto a contenuti realizzati con risorse esistenti o strumenti di editing rapido. Chiarisci in anticipo se il preventivo include shooting fotografici o riprese video, o solo l\'editing di materiale che fornisci tu.' },
      { type: 'h2', text: 'La reportistica' },
      { type: 'p', text: 'Un servizio professionale dovrebbe includere report periodici sui risultati (crescita follower, interazioni, eventualmente conversioni dalle campagne a pagamento), non solo la pubblicazione dei contenuti. È un buon indicatore di serietà da chiedere esplicitamente in fase di preventivo.' },
      { type: 'h2', text: 'Freelance o agenzia specializzata' },
      { type: 'p', text: 'Come per altri servizi digitali, un freelance offre in genere un costo più contenuto e un rapporto diretto, mentre un\'agenzia può garantire competenze diverse (grafica, copywriting, media buying) sotto lo stesso progetto. La scelta dipende dalla complessità della strategia che vuoi mettere in piedi.' },
      { type: 'h2', text: 'Come iniziare' },
      { type: 'p', text: 'Descrivi obiettivi, canali e budget indicativo nella tua richiesta su LavoraBene: riceverai proposte da professionisti specializzati in social media marketing, gratuitamente e senza impegno.' },
    ],
  },
  {
    slug: 'bandi-voucher-digitalizzazione-2026',
    title: 'Bandi e voucher 2026 per digitalizzare la tua azienda: la guida',
    excerpt: 'Molte aziende italiane non sanno di avere diritto a contributi, spesso a fondo perduto, per rifare il sito, aprire un e-commerce o digitalizzare i processi. Ecco dove guardare.',
    publishedAt: '2026-07-18',
    published: false,
    body: [
      { type: 'p', text: 'Se stai valutando di rifare il sito aziendale, aprire un e-commerce o digitalizzare qualche processo interno, prima di guardare al budget vale la pena controllare se esiste un contributo pubblico che copre parte della spesa. In Italia esistono diversi programmi attivi nel 2026, alcuni nazionali e alcuni regionali: ecco un punto di partenza, non un elenco definitivo — i dettagli cambiano spesso, quindi ogni sezione include il link ufficiale da controllare prima di procedere.' },

      { type: 'h2', text: 'Il Voucher Doppia Transizione (rete nazionale dei PID)' },
      { type: 'p', text: 'È il programma promosso dai Punti Impresa Digitale delle Camere di Commercio insieme a Unioncamere: 150 milioni di euro stanziati per il triennio 2026-2029, con contributi a fondo perduto fino al 70% delle spese per tecnologie digitali, formazione e consulenza, con un focus su intelligenza artificiale e transizione ecologica.' },
      { type: 'p', text: 'Un dettaglio importante: per accedere serve prima completare gratuitamente una "valutazione di maturità digitale" sul portale PID, nei tre mesi precedenti la domanda. Non tutte le Camere di Commercio aderiscono al bando nazionale, quindi il primo passo è controllare se la tua territoriale partecipa.' },
      { type: 'links', items: [
        { label: 'Punto Impresa Digitale — portale ufficiale', url: 'https://www.puntoimpresadigitale.camcom.it/' },
      ] },

      { type: 'h2', text: 'I voucher digitalizzazione regionali' },
      { type: 'p', text: 'Molte regioni hanno un proprio bando dedicato, con importi e regole diverse tra loro. Alcuni esempi attivi nel 2026 (importi indicativi, da verificare sempre sulla fonte ufficiale prima di fare domanda):' },
      { type: 'list', items: [
        'Lombardia — Voucher Digitali 4.0: contributo a fondo perduto fino a 10.000€ (50% delle spese) per tecnologie digitali avanzate.',
        'Lazio — Voucher Digitalizzazione PMI: fino a 50.000€ per micro imprese, 100.000€ per piccole, 150.000€ per medie imprese.',
        'Piemonte — nuova misura regionale per la transizione digitale approvata nel 2026, dettagli e importi in definizione.',
        'Veneto, Campania ed Emilia-Romagna hanno bandi analoghi attivi o in apertura nel corso del 2026.',
      ] },
      { type: 'links', items: [
        { label: 'Lombardia — Unioncamere Lombardia, bandi e incentivi', url: 'https://www.unioncamerelombardia.it/bandi-e-incentivi-alle-imprese' },
        { label: 'Lazio — Regione Lazio, Voucher Digitalizzazione PMI', url: 'https://fesr.regione.lazio.it/' },
        { label: 'Piemonte — bandi Regione Piemonte', url: 'https://bandi.regione.piemonte.it/' },
        { label: 'Catalogo nazionale incentivi per la digitalizzazione', url: 'https://www.incentivi.gov.it/it/catalogo/voucher-la-digitalizzazione-delle-pmi' },
      ] },

      { type: 'h2', text: 'Cosa si può finanziare, in genere' },
      { type: 'p', text: 'Le voci ammissibili variano da bando a bando, ma ricorrono spesso queste categorie:' },
      { type: 'list', items: [
        'Sviluppo o rifacimento di siti web ed e-commerce',
        'Software gestionali, CRM, soluzioni cloud',
        'Cybersecurity',
        'Formazione digitale del personale',
        'Automazione dei processi',
      ] },

      { type: 'h2', text: 'Come muoversi in pratica' },
      { type: 'list', items: [
        'Controlla se la Camera di Commercio della tua provincia aderisce al Voucher Doppia Transizione e completa la valutazione di maturità digitale gratuita.',
        'Controlla il bando specifico della tua regione tramite i link sopra: cambia da regione a regione, sia per importi che per scadenze.',
        'Una volta individuato un bando compatibile, verifica i requisiti formali (iscrizione al Registro Imprese, DURC in regola, quota associativa versata) prima di preparare la domanda.',
        'Trova il professionista che realizza il progetto finanziato: puoi pubblicare una richiesta gratuita su LavoraBene e ricevere preventivi da professionisti selezionati per siti web, e-commerce, software o marketing digitale.',
      ] },
      { type: 'p', text: 'Un\'ultima nota: questi programmi cambiano spesso — si aprono, si esauriscono, vengono rifinanziati con condizioni diverse. Considera questa pagina un punto di partenza per orientarti, non l\'ultima parola: verifica sempre importi, scadenze e requisiti sulla fonte ufficiale prima di investire tempo in una domanda.' },
    ],
  },
];

export const getPublishedPosts = (): BlogPost[] =>
  BLOG_POSTS.filter(p => p.published).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  BLOG_POSTS.find(p => p.slug === slug && p.published);
