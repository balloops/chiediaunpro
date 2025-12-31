
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole, ServiceCategory, SiteContent } from '../../types';
import { 
  Code, 
  Palette, 
  Camera, 
  Video, 
  BarChart3, 
  Search, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  Star,
  Box,
  Plus,
  Bot,
  ShoppingCart,
  AppWindow
} from 'lucide-react';
import { contentService } from '../../services/contentService';

interface LandingPageProps {
  user: User | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  const [content, setContent] = useState<SiteContent>(contentService.getContent());
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(contentService.getCategories());

  useEffect(() => {
    // Sync load for fast render
    setContent(contentService.getContent());
    setDynamicCategories(contentService.getCategories());
    
    // Async load for freshness
    contentService.fetchContent().then(setContent);
  }, []);

  // Helper to map category strings to icons (fallback for new dynamic categories)
  const getCategoryIcon = (name: string) => {
    switch(name) {
      case ServiceCategory.WEBSITE: return <Code className="text-blue-500" />;
      case ServiceCategory.ECOMMERCE: return <ShoppingCart className="text-emerald-500" />;
      case ServiceCategory.DESIGN: return <Palette className="text-purple-500" />;
      case ServiceCategory.BRANDING: return <Palette className="text-pink-500" />;
      case ServiceCategory.PHOTOGRAPHY: return <Camera className="text-orange-500" />;
      case ServiceCategory.VIDEO: return <Video className="text-red-500" />;
      case ServiceCategory.MARKETING: return <BarChart3 className="text-emerald-500" />;
      case ServiceCategory.SOFTWARE: return <AppWindow className="text-slate-700" />;
      case ServiceCategory.THREE_D: return <Box className="text-cyan-500" />;
      case ServiceCategory.AI: return <Bot className="text-fuchsia-500" />;
      default: return <Plus className="text-slate-400" />;
    }
  };

  const featureIcons = [<Zap className="text-amber-500" />, <CheckCircle2 className="text-green-500" />, <Star className="text-indigo-500" />];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-white pt-16 pb-32">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 -z-10 hidden lg:block rounded-l-[24px]"></div>
        <div className="max-w-[1250px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium">
                <Star size={14} className="fill-current" />
                <span>{content.home.hero.badgeText}</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1]">
                {content.home.hero.title}
              </h1>
              <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                {content.home.hero.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/post-job"
                  className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center text-lg"
                >
                  {content.home.hero.ctaPrimary}
                  <ChevronRight className="ml-2" />
                </Link>
                <Link 
                  to={user ? "/dashboard" : "/register?role=pro"}
                  className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center text-lg"
                >
                  {content.home.hero.ctaSecondary}
                </Link>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://picsum.photos/100/100?random=${i}`} className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="User" />
                  ))}
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">{content.home.stats.users}</div>
                </div>
                <div className="text-sm">
                  <span className="font-bold text-slate-900">{content.home.hero.reviewScore}</span> media recensioni su oltre <span className="font-bold text-indigo-600">{content.home.hero.reviewCount}</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse"></div>
              <img 
                src="https://picsum.photos/800/600?digital" 
                className="relative rounded-[24px] shadow-2xl z-10 w-full object-cover aspect-[4/3]"
                alt="Digital Work"
              />
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-[24px] shadow-xl z-20 hidden md:block border border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 text-green-600 p-2 rounded-xl">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Professionisti Verificati</div>
                    <div className="text-xs text-slate-500">Solo esperti con partita IVA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="services" className="py-24 bg-slate-50">
        <div className="max-w-[1250px] mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Di cosa hai bisogno?</h2>
            <p className="text-lg text-slate-600">Esplora le categorie principali e trova il talento ideale per scalare il tuo business digitale.</p>
          </div>

          {/* Mobile Optimization: tighter gap (gap-3), 2 cols, reduced padding (p-4) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {dynamicCategories.map((cat, idx) => (
              <Link 
                to="/post-job"
                state={{ selectedCategory: cat }}
                key={idx}
                className="group bg-white p-4 md:p-8 rounded-2xl md:rounded-[24px] border border-slate-100 hover:border-indigo-500 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer text-left block h-full"
              >
                <div className="mb-3 md:mb-6 p-3 md:p-4 rounded-2xl bg-slate-50 inline-block group-hover:bg-indigo-50 transition-colors">
                  {/* Fix: Cast to ReactElement<any> to allow 'size' prop override */}
                  {React.cloneElement(getCategoryIcon(cat) as React.ReactElement<any>, { size: window.innerWidth < 768 ? 24 : 32 })}
                </div>
                <h3 className="text-sm md:text-xl font-bold text-slate-900 mb-1 md:mb-2 leading-tight">{cat}</h3>
                <div className="text-xs md:text-sm text-slate-500 mb-0 md:mb-4">Esperti Disponibili</div>
                {/* Hide hover text on mobile to save vertical space */}
                <div className="hidden md:flex items-center text-indigo-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Richiedi preventivi <ChevronRight size={16} className="ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-[1250px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="grid grid-cols-2 gap-4">
              <img src="https://picsum.photos/400/500?worker1" className="rounded-[24px] shadow-lg mt-8" alt="Pro" />
              <img src="https://picsum.photos/400/500?worker2" className="rounded-[24px] shadow-lg" alt="Pro" />
            </div>
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">
                {content.home.features.title}
              </h2>
              <p className="text-lg text-slate-500 mb-10">{content.home.features.description}</p>
              <div className="space-y-8">
                {content.home.features.items.map((item, i) => (
                  <div key={i} className="flex items-start space-x-6">
                    <div className="bg-slate-50 p-4 rounded-2xl shrink-0">
                      {featureIcons[i % featureIcons.length]}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                      <p className="text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-[1250px] mx-auto bg-indigo-600 rounded-[24px] p-12 lg:p-24 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-[80px]"></div>
          
          <h2 className="text-4xl lg:text-6xl font-extrabold text-white mb-8 relative z-10">
            {content.home.cta.title}
          </h2>
          <p className="text-indigo-100 text-xl mb-12 max-w-2xl mx-auto relative z-10">
            {content.home.cta.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            <Link 
              to="/post-job" 
              className="px-10 py-5 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-slate-100 transition-all text-xl shadow-2xl shadow-black/20"
            >
              {content.home.cta.buttonClient}
            </Link>
            <Link 
              to="/register?role=pro" 
              className="px-10 py-5 bg-indigo-500/40 backdrop-blur-md text-white border-2 border-white/30 font-bold rounded-2xl hover:bg-indigo-500/60 transition-all text-xl"
            >
              {content.home.cta.buttonPro}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
