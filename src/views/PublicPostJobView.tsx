
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ServiceCategory, User, UserRole, JobLocation, FormDefinition } from '../../types';
import { 
  ArrowLeft, 
  ChevronRight, 
  Send, 
  Code, 
  ShoppingCart, 
  Palette, 
  Camera, 
  Video, 
  BarChart3, 
  AppWindow, 
  Plus, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Euro, 
  Box,
  AlertCircle,
  LayoutDashboard,
  Bot
} from 'lucide-react';
import { jobService } from '../../services/jobService';
import { contentService } from '../../services/contentService';
import { authService } from '../../services/authService';
import ServiceForm from '../../components/ServiceForm';

interface PublicPostJobViewProps {
  user: User | null;
  onLogin: (user: User) => void;
}

const PublicPostJobView: React.FC<PublicPostJobViewProps> = ({ user, onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'category' | 'details' | 'auth'>('category');
  
  // Data State
  const [categories, setCategories] = useState<string[]>(contentService.getCategories());
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobDetails, setJobDetails] = useState<Record<string, any>>({});
  const [budget, setBudget] = useState('');
  const [locationCity, setLocationCity] = useState('');

  // Auth Interstitial State
  const [authMode, setAuthMode] = useState<'choice' | 'login' | 'register'>('choice');
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    setCategories(contentService.getCategories());
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).selectedCategory) {
      handleCategorySelect((location.state as any).selectedCategory);
    }
  }, [location]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const def = contentService.getFormDefinition(category);
    setFormDefinition(def);
    setStep('details');
    window.scrollTo(0, 0);
  };

  const getCategoryIcon = (name: string) => {
    // Map standard categories to icons, fallback for custom/new ones
    // Colors synchronized with LandingPage.tsx
    switch(name) {
      case ServiceCategory.WEBSITE: return { icon: <Code />, color: 'text-blue-500', desc: 'Siti aziendali, Landing' };
      case ServiceCategory.ECOMMERCE: return { icon: <ShoppingCart />, color: 'text-emerald-500', desc: 'Vendi prodotti online' };
      case ServiceCategory.DESIGN: return { icon: <Palette />, color: 'text-purple-500', desc: 'UI/UX per App e Web' };
      case ServiceCategory.BRANDING: return { icon: <Palette />, color: 'text-pink-500', desc: 'Loghi, Identità Visiva' };
      case ServiceCategory.PHOTOGRAPHY: return { icon: <Camera />, color: 'text-orange-500', desc: 'Prodotti, Ritratti' };
      case ServiceCategory.VIDEO: return { icon: <Video />, color: 'text-red-500', desc: 'Editing, Motion' };
      case ServiceCategory.MARKETING: return { icon: <BarChart3 />, color: 'text-emerald-500', desc: 'Social, Ads, SEO' }; 
      case ServiceCategory.SOFTWARE: return { icon: <AppWindow />, color: 'text-slate-700', desc: 'SaaS, Gestionali' };
      case ServiceCategory.THREE_D: return { icon: <Box />, color: 'text-cyan-500', desc: 'Rendering, 3D' };
      case ServiceCategory.AI: return { icon: <Bot />, color: 'text-fuchsia-500', desc: 'Chatbot, Automazione, ML' };
      default: return { icon: <Plus />, color: 'text-slate-400', desc: 'Servizi personalizzati' };
    }
  };

  const saveAndRedirect = async (currentUser: User) => {
    if (selectedCategory) {
      try {
        await jobService.createJob({
          clientId: currentUser.id,
          clientName: currentUser.name,
          category: selectedCategory,
          description: jobDescription,
          details: jobDetails,
          budget: budget,
          location: locationCity ? { city: locationCity } : undefined
        });
        navigate('/dashboard');
      } catch (err: any) {
        console.error("Failed to create job", err);
        setError("Errore nel salvataggio della richiesta: " + err.message);
        setIsSubmitting(false);
      }
    }
  };

  const handleFinalSubmit = () => {
    if (!user) {
      setStep('auth');
      window.scrollTo(0, 0);
    } else {
      saveAndRedirect(user);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let loggedUser: User | null = null;

      if (authMode === 'register') {
         // Perform REAL registration
         await authService.signUp(authData.email, authData.password, {
            name: authData.name,
            role: UserRole.CLIENT
         });
         // After sign up, fetch the user
         loggedUser = await authService.getCurrentUser();
      } else {
         // Perform REAL login
         await authService.signIn(authData.email, authData.password);
         loggedUser = await authService.getCurrentUser();
      }

      if (loggedUser) {
         onLogin(loggedUser);
         // Now create the job with the REAL user ID
         await saveAndRedirect(loggedUser);
      } else {
         throw new Error("Impossibile recuperare l'utente dopo l'autenticazione.");
      }

    } catch (err: any) {
       console.error(err);
       setError(err.message || "Errore durante l'autenticazione.");
       setIsSubmitting(false);
    }
  };

  const progress = step === 'category' ? 33 : step === 'details' ? 66 : 100;

  return (
    // Removed horizontal padding on mobile (px-0 md:px-6) and top padding reduction
    <div className="min-h-screen bg-slate-50 pt-0 md:pt-12 pb-32 px-0 md:px-6">
      <div className="max-w-[1250px] mx-auto">
        
        {/* Back to Dashboard Link (Only if Logged In) - Hidden on very small screens if needed, but keeping for now with margin adjustment */}
        {user && (
           <div className="hidden md:block mb-6 animate-in fade-in slide-in-from-left-4">
              <Link to="/dashboard" className="inline-flex items-center space-x-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors">
                 <LayoutDashboard size={18} />
                 <span>Torna alla Dashboard</span>
              </Link>
           </div>
        )}
        
        {/* Card: Rounded only on desktop, shadow only on desktop */}
        <div className="bg-white rounded-none md:rounded-[24px] shadow-none md:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] border-x-0 border-y-0 md:border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Header */}
          <div className="px-5 py-5 md:px-10 md:py-8 border-b border-slate-200 bg-white sticky top-0 z-10 backdrop-blur-md bg-white/95">
            <div className="flex items-center space-x-4 md:space-x-6 w-full">
              {(step === 'details' || (step === 'auth' && authMode !== 'choice')) && (
                <button 
                  onClick={() => {
                     if (step === 'auth') setAuthMode('choice');
                     else setStep('category');
                     window.scrollTo(0, 0);
                  }} 
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 text-slate-400 hover:text-indigo-600 rounded-xl md:rounded-[18px] transition-all border border-transparent hover:border-indigo-100 shrink-0"
                >
                  <ArrowLeft size={20} className="md:w-6 md:h-6" />
                </button>
              )}
              <div className="flex-1">
                <h2 className="text-xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight truncate">
                  {step === 'category' ? 'Di cosa hai bisogno?' : 
                   step === 'details' ? selectedCategory : 'Ultimo passaggio!'}
                </h2>
                <p className="text-slate-400 text-xs md:text-base mt-1 font-medium truncate">
                  {step === 'category' ? 'Seleziona una categoria per iniziare.' : 
                   step === 'details' ? 'Definiamo insieme i contorni della tua idea.' : 
                   'Accedi per salvare la tua richiesta.'}
                </p>
                <div className="mt-3 md:mt-5 h-1 md:h-1.5 w-full max-w-sm bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,96,227,0.3)]"
                      style={{ width: `${progress}%` }}
                    ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-12">
            {step === 'category' && (
              // Optimized Grid for Mobile: 2 cols, smaller gaps, no fixed height on mobile to save space
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {categories.map((cat) => {
                  const info = getCategoryIcon(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className="group p-4 md:p-10 rounded-2xl md:rounded-[24px] border-2 border-slate-100 bg-white hover:border-indigo-600 hover:shadow-[0_20px_50px_rgba(0,96,227,0.1)] transition-all text-left flex flex-col justify-between h-auto md:h-72"
                    >
                      <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[22px] bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all ${info.color} shadow-sm group-hover:scale-110 mb-3 md:mb-0`}>
                        {/* Fix: Cast to ReactElement<any> to allow 'size' prop override */}
                        {React.cloneElement(info.icon as React.ReactElement<any>, { size: window.innerWidth < 768 ? 20 : 32 })}
                      </div>
                      <div className="mt-0 md:mt-8">
                        <div className="font-black text-slate-900 text-sm md:text-2xl group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2 mb-1 md:mb-0">{cat}</div>
                        <div className="text-xs md:text-sm text-slate-400 font-medium mt-1 md:mt-2 hidden md:block">{info.desc}</div>
                        {/* Hide hover text on mobile */}
                        <div className="hidden md:flex items-center text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          Seleziona categoria <ChevronRight size={12} className="ml-1" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 'details' && formDefinition && (
              <div className="space-y-12 md:space-y-20 w-full">
                <ServiceForm 
                  formDefinition={formDefinition}
                  description={jobDescription}
                  setDescription={setJobDescription}
                  details={jobDetails}
                  setDetails={setJobDetails}
                />

                <section className="space-y-6 md:space-y-10 px-1 sm:px-4">
                   <div className="flex items-start space-x-5 mb-6">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                      <Euro size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">Budget & Logistica</h4>
                      <p className="text-base text-slate-500 font-medium mt-1">Informazioni chiave per la fattibilità economica.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <div className="space-y-4 md:space-y-6">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Budget Stimato</label>
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        {formDefinition.budgetOptions.map(b => (
                          <button 
                            key={b}
                            onClick={() => setBudget(b)}
                            className={`py-4 md:py-5 px-3 md:px-4 rounded-xl md:rounded-[24px] text-xs md:text-sm font-black border-2 transition-all duration-200 ${
                              budget === b 
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-[1.02]' 
                                : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 bg-white'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {formDefinition.askLocation && (
                      <div className="space-y-4 md:space-y-6">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Città (Opzionale)</label>
                        <div className="relative">
                            <MapPin className="absolute top-4 left-4 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={locationCity}
                              onChange={(e) => setLocationCity(e.target.value)}
                              placeholder="es. Milano, Remoto, Roma..."
                              className="w-full bg-white border-2 border-slate-200 rounded-xl md:rounded-[24px] py-4 pl-12 pr-6 text-sm font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all"
                            />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <div className="pt-4 md:pt-8 px-1 sm:px-4">
                  <button 
                    disabled={!jobDescription || !budget}
                    className="w-full py-5 md:py-7 bg-indigo-600 text-white font-black rounded-xl md:rounded-[24px] hover:bg-indigo-700 shadow-[0_20px_60px_-10px_rgba(0,96,227,0.3)] transition-all text-xl md:text-2xl flex items-center justify-center disabled:opacity-50 disabled:shadow-none group"
                    onClick={handleFinalSubmit}
                  >
                    {user ? 'Invia Richiesta Pro' : 'Continua e Pubblica'}
                    <ChevronRight className="ml-3 group-hover:translate-x-2 transition-transform" size={24} />
                  </button>
                  <p className="text-center text-slate-400 text-xs md:text-sm mt-6 font-medium">Riceverai i primi preventivi in meno di 24 ore.</p>
                </div>
              </div>
            )}

            {step === 'auth' && (
              <div className="max-w-md mx-auto py-12">
                {authMode === 'choice' ? (
                  <div className="space-y-12 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-100">
                      <UserCheck size={48} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 mb-2">Un'ultima cosa...</h3>
                      <p className="text-slate-500 font-medium">Abbiamo bisogno di sapere chi sei per inviarti le proposte dei Pro.</p>
                    </div>
                    
                    <div className="flex flex-col space-y-4">
                      <button 
                        onClick={() => setAuthMode('register')}
                        className="w-full py-6 bg-indigo-600 text-white font-black rounded-[24px] hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center text-lg"
                      >
                        Registrati come cliente
                      </button>
                      <button 
                        onClick={() => setAuthMode('login')}
                        className="w-full py-6 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-[24px] hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center"
                      >
                        Ho già un account
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                            <AlertCircle size={20} />
                            <span className="text-sm font-bold">{error}</span>
                        </div>
                    )}
                    
                    {authMode === 'register' && (
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome e Cognome</label>
                        <input 
                          type="text" 
                          required
                          value={authData.name}
                          onChange={e => setAuthData({...authData, name: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-slate-100 py-5 px-8 rounded-2xl focus:border-indigo-500 outline-none transition-all text-lg font-medium"
                          placeholder="es. Mario Rossi"
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <input 
                        type="email" 
                        required
                        value={authData.email}
                        onChange={e => setAuthData({...authData, email: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 py-5 px-8 rounded-2xl focus:border-indigo-500 outline-none transition-all text-lg font-medium"
                        placeholder="nome@email.it"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                      <input 
                        type="password" 
                        required
                        value={authData.password}
                        onChange={e => setAuthData({...authData, password: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 py-5 px-8 rounded-2xl focus:border-indigo-500 outline-none transition-all text-lg font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 bg-indigo-600 text-white font-black rounded-[24px] hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center text-xl disabled:opacity-70"
                    >
                      {isSubmitting ? 'Elaborazione...' : (authMode === 'register' ? 'Registrati e Chiedi' : 'Accedi e Chiedi')}
                    </button>
                    <p className="text-center text-sm text-slate-400 font-medium">
                      {authMode === 'register' ? 'Hai già un account?' : 'Non hai un account?'} 
                      <button type="button" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')} className="ml-2 text-indigo-600 font-bold hover:underline">
                        {authMode === 'register' ? 'Accedi' : 'Registrati'}
                      </button>
                    </p>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicPostJobView;
