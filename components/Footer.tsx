
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { contentService } from '../services/contentService';
import { SiteContent } from '../types';

const Footer: React.FC = () => {
  const location = useLocation();
  const isBackend = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');
  const [content, setContent] = useState<SiteContent>(contentService.getContent());

  useEffect(() => {
    // Reload content when location changes to catch admin updates or initial load
    contentService.fetchContent().then(setContent);
  }, [location]); 
  
  if (isBackend) {
    return null;
  }
  
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-6">
      <div className="max-w-[1250px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-4">{content.branding.platformName}</h3>
          <p className="text-sm">{content.footer.aboutText}</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Per i Clienti</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/how-it-works" className="hover:text-white transition-colors">Come funziona</Link></li>
            <li><Link to="/post-job" className="hover:text-white transition-colors">Chiedi un preventivo</Link></li>
            <li><Link to="/help" className="hover:text-white transition-colors">Centro Assistenza</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Per i Pro</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/register?role=pro" className="hover:text-white transition-colors">Trova lavori</Link></li>
            <li><Link to="/register?role=pro" className="hover:text-white transition-colors">Iscriviti come Pro</Link></li>
            <li><Link to="/help" className="hover:text-white transition-colors">Supporto Pro</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Legale</h4>
          <ul className="space-y-2 text-sm">
            {content.footer.legalLinks.map((linkText, i) => (
              <li key={i}>
                <a href="#" className="hover:text-white transition-colors">{linkText}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="max-w-[1250px] mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-xs">
        © {new Date().getFullYear()} {content.branding.platformName}. Tutti i diritti riservati.
      </div>
    </footer>
  );
};

export default Footer;
