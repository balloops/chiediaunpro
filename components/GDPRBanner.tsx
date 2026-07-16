
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
    <div className="fixed bottom-4 left-4 right-4 z-[200] animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div className="max-w-2xl mx-auto bg-slate-900 text-white pl-4 pr-3 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 backdrop-blur-xl">
        <Shield size={16} className="text-indigo-400 shrink-0 hidden sm:block" />
        <p className="text-xs text-slate-300 leading-snug flex-1">
          Usiamo cookie tecnici per migliorare la tua esperienza.{' '}
          <a href="#" className="text-white underline hover:text-indigo-400 transition-colors">Termini di servizio</a>.
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 px-4 py-2 bg-white text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all flex items-center space-x-1.5"
        >
          <Check size={14} />
          <span>Accetto</span>
        </button>
        <button
          onClick={handleClose}
          className="shrink-0 p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
          aria-label="Chiudi e accetta cookie tecnici"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default GDPRBanner;
