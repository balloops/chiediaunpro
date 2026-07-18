
import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Calendar, ExternalLink, ArrowRight } from 'lucide-react';
import SEO from '../../components/SEO';
import { BANDI, BANDO_REGIONS, BANDO_CATEGORIES, Bando } from '../data/bandi';
import { useNavigate } from 'react-router-dom';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

const BandoCard: React.FC<{ bando: Bando }> = ({ bando }) => (
  <div className="bg-white rounded-[24px] border border-slate-200 p-6 md:p-8 hover:border-indigo-200 hover:shadow-lg transition-all">
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
        <MapPin size={12} />
        {bando.region}
      </span>
      {bando.categories.map(cat => (
        <span key={cat} className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
          {cat}
        </span>
      ))}
    </div>

    <h3 className="text-xl font-black text-slate-900 mb-2">{bando.title}</h3>
    <p className="text-indigo-600 font-bold text-sm mb-3">{bando.amountLabel}</p>
    <p className="text-slate-500 leading-relaxed mb-4">{bando.description}</p>

    {bando.requirements.length > 0 && (
      <ul className="space-y-1.5 mb-5 text-sm text-slate-500 list-disc list-inside">
        {bando.requirements.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    )}

    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Calendar size={12} />
        Verificato al {formatDate(bando.lastVerifiedAt)}
      </div>
      <a
        href={bando.officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-bold text-sm"
      >
        {bando.officialUrlLabel}
        <ExternalLink size={14} className="ml-1.5" />
      </a>
    </div>
  </div>
);

const BandiView: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState<string>('Tutte');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const toggleCategory = (cat: string) => {
    setActiveCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const filtered = useMemo(() => {
    return BANDI.filter(b => {
      const matchesQuery = searchQuery.trim() === '' ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = region === 'Tutte' || b.region === region || b.region === 'Nazionale';
      const matchesCategories = activeCategories.length === 0 ||
        activeCategories.some(cat => b.categories.includes(cat as any));
      return matchesQuery && matchesRegion && matchesCategories;
    });
  }, [searchQuery, region, activeCategories]);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <SEO
        title="Bandi e Voucher per Digitalizzare la tua Azienda"
        description="Contributi e voucher pubblici, nazionali e regionali, per rifare il sito, aprire un e-commerce o digitalizzare la tua azienda. Aggiornati e verificati con link alle fonti ufficiali."
        path="/bandi"
      />

      {/* Hero Search Section */}
      <div className="bg-indigo-600 pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl -ml-10 -mb-10"></div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">Bandi e Voucher per Digitalizzare</h1>
          <p className="text-indigo-100 mb-6">Contributi pubblici, nazionali e regionali, per finanziare sito web, e-commerce e digitalizzazione della tua azienda.</p>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Cerca per parola chiave (es. e-commerce, cybersecurity...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-4 pl-14 pr-6 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-indigo-200 focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all font-medium text-lg shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 -mt-8 relative z-20">
        {/* Filters */}
        <div className="bg-white p-6 rounded-[20px] shadow-lg shadow-indigo-500/10 border border-slate-100 mb-10 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Regione</label>
            <div className="flex flex-wrap gap-2">
              {['Tutte', ...BANDO_REGIONS].map(r => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${region === r ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {BANDO_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeCategories.includes(cat) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Nessun bando trovato con questi filtri.</p>
        ) : (
          <div className="space-y-6">
            {filtered.map(b => <BandoCard key={b.id} bando={b} />)}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 text-center mt-10 max-w-lg mx-auto leading-relaxed">
          Questi programmi cambiano spesso — si aprono, si esauriscono, vengono rifinanziati con condizioni diverse.
          Considera questa pagina un punto di partenza per orientarti, non l'ultima parola: verifica sempre importi,
          scadenze e requisiti sulla fonte ufficiale prima di fare domanda.
        </p>

        {/* CTA */}
        <div className="mt-12 bg-slate-900 rounded-[24px] p-10 text-center">
          <h2 className="text-2xl font-black text-white mb-4">Hai ottenuto (o stai per ottenere) un contributo?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Trova il professionista che realizza il progetto finanziato: pubblica una richiesta gratuita su LavoraBene.
          </p>
          <button
            onClick={() => navigate('/post-job')}
            className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-50 transition-all inline-flex items-center"
          >
            Pubblica Richiesta Gratis
            <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BandiView;
