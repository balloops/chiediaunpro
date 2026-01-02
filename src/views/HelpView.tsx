
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Briefcase, 
  MessageCircle, 
  Mail, 
  FileQuestion,
  ShieldCheck
} from 'lucide-react';
import { contentService } from '../../services/contentService';
import { SiteContent } from '../../types';

const HelpView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'client' | 'pro'>('client');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState<SiteContent>(contentService.getContent());

  useEffect(() => {
    window.scrollTo(0, 0);
    // Fetch latest content from DB
    contentService.fetchContent().then(setContent);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const allFaqs = content.helpCenter?.items || [];
  
  const filteredFaqs = allFaqs.filter(f => 
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Search Section */}
      <div className="bg-indigo-600 pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-6">{content.helpCenter?.title || 'Come possiamo aiutarti?'}</h1>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cerca una risposta (es. crediti, pagamenti, account...)"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setOpenFaq(null); }}
              className="w-full py-4 pl-14 pr-6 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-indigo-200 focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all font-medium text-lg shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 -mt-8 relative z-20">
        {/* Role Switcher */}
        <div className="bg-white p-2 rounded-[20px] shadow-lg shadow-indigo-500/10 border border-slate-100 flex mb-12 max-w-md mx-auto">
          <button 
            onClick={() => { setActiveTab('client'); setOpenFaq(null); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'client' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <User size={18} />
            <span>Per i Clienti</span>
          </button>
          <button 
            onClick={() => { setActiveTab('pro'); setOpenFaq(null); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'pro' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Briefcase size={18} />
            <span>Per i Professionisti</span>
          </button>
        </div>

        {/* FAQs Categories / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           <div className="col-span-1 md:col-span-2 space-y-4">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center">
                <FileQuestion className="mr-2 text-indigo-600" />
                Domande Frequenti
              </h2>
              
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <div key={index} className="bg-white rounded-[24px] border border-slate-100 overflow-hidden transition-all hover:border-indigo-100 hover:shadow-md">
                    <button 
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1 block">{faq.category}</span>
                        <span className="font-bold text-slate-800 text-sm md:text-base">{faq.question}</span>
                      </div>
                      {openFaq === index ? <ChevronUp className="text-indigo-600 shrink-0 ml-4" /> : <ChevronDown className="text-slate-400 shrink-0 ml-4" />}
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-slate-500 text-sm leading-relaxed border-t border-slate-50 pt-4">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-[24px] border border-dashed border-slate-200">
                   <p className="text-slate-400 font-medium">Nessun risultato trovato per "{searchQuery}"</p>
                </div>
              )}
           </div>

           {/* Quick Actions / Contact */}
           <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 mb-6">Supporto Diretto</h2>
              
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm text-center">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail size={24} />
                 </div>
                 <h3 className="font-bold text-slate-900 mb-2">Email Support</h3>
                 <p className="text-xs text-slate-500 mb-4">Ci impegniamo a rispondere in 24h</p>
                 <a href="mailto:support@chiediunpro.it" className="block w-full py-3 bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded-xl text-sm hover:bg-slate-100 transition-all">
                    Scrivici
                 </a>
              </div>

              <div className="p-6 rounded-[24px] bg-slate-100 border border-slate-200">
                 <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
                    <ShieldCheck size={16} className="mr-2 text-indigo-600" />
                    Sicurezza
                 </h4>
                 <p className="text-[11px] text-slate-500 leading-relaxed">
                    Non condividere mai la tua password o i dati della carta di credito via chat. Il supporto di {content.branding.platformName} non ti chiederà mai queste informazioni.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HelpView;
