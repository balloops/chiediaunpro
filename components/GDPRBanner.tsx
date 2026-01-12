
import React, { useState, useEffect } from 'react';
import { Shield, Check, X } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

const GDPRBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('chiediunpro_gdpr_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('chiediunpro_gdpr_consent', new Date().toISOString());
    setIsVisible(false);
    
    // Inizializza tracciamento (GA + Ads)
    analyticsService.initialize();
    analyticsService.trackEvent('cookie_consent_given');
  };

  // Logica modificata: chiudere il banner equivale ad accettare i cookie tecnici (inclusi GA/Ads in questo contesto)
  const handleClose = () => {
    handleAccept();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[200] animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div className="max-w-4xl mx-auto bg-slate-900 text-white p-6 md:p-8 md:pr-16 rounded-[24px] shadow-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl relative">
        
        {/* Pulsante di chiusura (X) - Ora attiva i cookie */}
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 md:top-4 md:right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
          aria-label="Chiudi e accetta cookie tecnici"
        >
          <X size={20} />
        </button>

        <div className="flex items-center space-x-6 text-center md:text-left w-full md:w-auto">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 hidden sm:flex">
            <Shield size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-lg mb-1 pr-8 md:pr-0">Informativa Privacy e Cookie</h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Chiudendo questo banner, scorrendo questa pagina o cliccando su "Accetto", acconsenti all'uso dei cookie tecnici (che includono Google Analytics e Ads) per migliorare la tua esperienza.
              <br />
              <a href="#" className="text-white underline hover:text-indigo-400 transition-colors mt-1 inline-block">Termini di servizio</a>.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none px-10 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center space-x-2"
          >
            <Check size={18} />
            <span>Accetto</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GDPRBanner;
