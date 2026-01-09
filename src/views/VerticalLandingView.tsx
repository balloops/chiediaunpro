import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ServiceCategory } from '../../types';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Zap
} from 'lucide-react';

// Configurazione dei contenuti per ogni verticale con Immagini Multiple Verificate
const LANDING_CONFIG: Record<string, {
  category: string; // Deve corrispondere ai valori in ServiceCategory o stringhe usate nel form
  title: string;
  subtitle: string;
  benefits: string[];
  heroImages: string[]; // Array di immagini
}> = {
  'sito-web': {
    category: ServiceCategory.WEBSITE,
    title: 'Realizza il tuo Sito Web Professionale',
    subtitle: 'Trova sviluppatori esperti per creare il tuo sito vetrina, landing page o portale aziendale. Ricevi preventivi in 24 ore.',
    benefits: ['Siti veloci e ottimizzati SEO', 'Design moderno e responsive', 'Gestione autonoma dei contenuti'],
    heroImages: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80', // Laptop code
      'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80', // Workspace
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80'  // Coding
    ]
  },
  'ecommerce': {
    category: ServiceCategory.ECOMMERCE,
    title: 'Apri il tuo Negozio Online',
    subtitle: 'Esperti in Shopify, WooCommerce e PrestaShop pronti a lanciare il tuo business digitale.',
    benefits: ['Integrazione pagamenti sicuri', 'Gestione magazzino automatizzata', 'Strategie di conversione incluse'],
    heroImages: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=800&q=80', // Card Payment
      'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80', // POS
      'https://images.unsplash.com/photo-1472851294608-4155f2118c67?auto=format&fit=crop&w=800&q=80'  // Store
    ]
  },
  'social-media': {
    category: ServiceCategory.MARKETING,
    title: 'Scala il tuo business con il Social Media Marketing',
    subtitle: 'Social Media Manager e Advertiser certificati per gestire le tue campagne Facebook, Instagram e LinkedIn.',
    benefits: ['Piano editoriale su misura', 'Gestione campagne Ads (ROAS positivo)', 'Reportistica mensile dettagliata'],
    heroImages: [
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80', // Social Apps
      'https://images.unsplash.com/photo-1611926653458-09294b3142bf?auto=format&fit=crop&w=800&q=80', // Social Mix
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'  // Meeting
    ]
  },
  'logo-branding': {
    category: ServiceCategory.BRANDING,
    title: 'Logo e Identità Visiva che lasciano il segno',
    subtitle: 'Designer professionisti per creare il logo perfetto e l\'immagine coordinata della tua azienda.',
    benefits: ['Logo vettoriale scalabile', 'Palette colori e font system', 'Brand Guidelines incluse'],
    heroImages: [
      'https://images.unsplash.com/photo-1626785774573-4b799314347d?auto=format&fit=crop&w=800&q=80', // Branding
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80', // Sketching
      'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80'  // Design tools
    ]
  },
  'sviluppo-app': {
    category: ServiceCategory.SOFTWARE,
    title: 'Sviluppo App iOS e Android',
    subtitle: 'Trasforma la tua idea in un\'applicazione mobile performante. Sviluppatori nativi e cross-platform.',
    benefits: ['UX/UI Design intuitivo', 'Pubblicazione su Store Apple/Google', 'Manutenzione e supporto'],
    heroImages: [
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80', // Mobile hand
      'https://images.unsplash.com/photo-1551650975-87bd1e887d67?auto=format&fit=crop&w=800&q=80', // UI Design
      'https://images.unsplash.com/photo-1526498463720-33a928666327?auto=format&fit=crop&w=800&q=80'  // Code Screen
    ]
  },
  'video-editing': {
    category: ServiceCategory.VIDEO,
    title: 'Video Editing e Motion Graphics',
    subtitle: 'Montaggio video professionale per spot, social media, eventi e presentazioni aziendali.',
    benefits: ['Color Correction cinematografica', 'Sound Design e mixaggio', 'Animazioni e titoli grafici'],
    heroImages: [
      'https://images.unsplash.com/photo-1574717432707-c67803b27bba?auto=format&fit=crop&w=800&q=80', // Editing Timeline
      'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80', // Lens
      'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=800&q=80'  // Filmmaking
    ]
  }
};

const VerticalLandingView: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const content = slug && LANDING_CONFIG[slug] ? LANDING_CONFIG[slug] : null;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentImageIndex(0); // Reset immagine quando cambia pagina
  }, [slug]);

  // Image Rotation Logic
  useEffect(() => {
    if (!content) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % content.heroImages.length);
    }, 5000); // Cambia ogni 5 secondi

    return () => clearInterval(interval);
  }, [content]);

  if (!content) {
    // Fallback se lo slug non esiste
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col p-6 text-center">
        <h1 className="text-3xl font-black text-slate-900 mb-4">Pagina non trovata</h1>
        <p className="text-slate-500 mb-8">La categoria che cerchi non sembra esistere.</p>
        <Link to="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Torna alla Home</Link>
      </div>
    );
  }

  const handleCtaClick = () => {
    // Naviga direttamente al post-job con la categoria pre-selezionata
    navigate('/post-job', { state: { selectedCategory: content.category } });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 px-6 overflow-hidden">
        <div className="max-w-[1250px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide border border-indigo-100">
              <Zap size={14} className="fill-indigo-700" />
              <span>Preventivi Gratuiti</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1]">
              {content.title}
            </h1>
            
            <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
              {content.subtitle}
            </p>

            <ul className="space-y-4">
              {content.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center space-x-3 text-slate-700 font-medium">
                  <div className="bg-green-100 text-green-600 p-1 rounded-full shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleCtaClick}
                className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center text-lg group"
              >
                Richiedi Preventivo
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center justify-center px-6 py-4 text-slate-500 text-sm font-medium">
                <ShieldCheck size={18} className="mr-2 text-slate-400" />
                Nessun costo per te
              </div>
            </div>
            
            {/* Social Proof (Updated) */}
            <div className="flex items-center gap-6 pt-6">
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://picsum.photos/100/100?random=${i + 25}`} className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" alt="User" />
                  ))}
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">
                     +1k
                  </div>
               </div>
               <div className="text-sm md:text-base">
                  <span className="font-black text-slate-900">Meno recensioni,</span> <span className="text-slate-700 font-medium">più lavori</span> <span className="font-black text-indigo-600">fatti bene.</span>
               </div>
            </div>
          </div>

          {/* DYNAMIC IMAGE CAROUSEL */}
          <div className="relative h-[400px] md:h-[500px] w-full rounded-[32px] overflow-hidden shadow-2xl border-4 border-white animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 z-10 pointer-events-none"></div>
             
             {/* Images Stacked */}
             {content.heroImages.map((img, idx) => (
                <img 
                  key={img}
                  src={img} 
                  alt={`${content.title} ${idx + 1}`} 
                  // Safety: Hide on Error
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                />
             ))}
             
             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hidden md:block z-20">
                <div className="flex items-center space-x-4">
                   <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                      <Clock size={24} />
                   </div>
                   <div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tempo di risposta</div>
                      <div className="text-lg font-black text-slate-900">Media &lt; 4 ore</div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </section>

      {/* How it works simple strip */}
      <section className="bg-slate-50 py-16 px-6 border-y border-slate-200">
         <div className="max-w-[1250px] mx-auto">
            <h2 className="text-center text-2xl font-black text-slate-900 mb-12">Come funziona LavoraBene</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                  { step: '1', title: 'Descrivi il progetto', desc: 'Rispondi a poche domande specifiche per la tua richiesta.' },
                  { step: '2', title: 'Ricevi proposte', desc: 'I professionisti qualificati ti inviano i loro preventivi.' },
                  { step: '3', title: 'Scegli il migliore', desc: 'Confronta profili e prezzi, poi inizia a collaborare.' }
               ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                     <div className="w-12 h-12 bg-white text-indigo-600 border-2 border-indigo-100 rounded-full flex items-center justify-center font-black text-xl mb-4 shadow-sm">
                        {item.step}
                     </div>
                     <h3 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h3>
                     <p className="text-slate-500 text-sm max-w-xs">{item.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6">
         <div className="max-w-4xl mx-auto bg-slate-900 rounded-[32px] p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>
            
            <h2 className="text-3xl font-black text-white mb-6 relative z-10">Pronto a iniziare?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto relative z-10">
               Non perdere tempo a cercare a vuoto. Pubblica la tua richiesta gratuitamente e lascia che siano i professionisti a venire da te.
            </p>
            <button 
               onClick={handleCtaClick}
               className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-50 transition-all text-lg shadow-xl relative z-10"
            >
               Pubblica Richiesta Gratis
            </button>
         </div>
      </section>
    </div>
  );
};

export default VerticalLandingView;