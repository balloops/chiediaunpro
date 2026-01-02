
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, UserRole, ServiceCategory } from '../../types';
import { User as UserIcon, Briefcase, Mail, Lock, UserCheck, ArrowRight, ShieldCheck, ArrowLeft, MapPin, Globe, FileText, CreditCard, Zap, AlertCircle, Check, Phone, Star } from 'lucide-react';
import { authService } from '../../services/authService';
import { contentService } from '../../services/contentService';

interface RegisterViewProps {
  onLogin: (user: User) => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'pro' ? UserRole.PROFESSIONAL : UserRole.CLIENT;
  const content = contentService.getContent();

  const [role, setRole] = useState<UserRole>(initialRole);
  const [step, setStep] = useState(1);
  
  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // New Phone Field
  
  // Pro Fields
  const [brandName, setBrandName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [offeredServices, setOfferedServices] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleService = (cat: string) => {
    setOfferedServices(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleNext = () => {
    if (role === UserRole.PROFESSIONAL && step < 3) {
      setStep(step + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinalSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      const userData: Partial<User> = {
        name,
        role,
        phoneNumber: phoneNumber || undefined,
        brandName: role === UserRole.PROFESSIONAL ? (brandName || name) : undefined,
        location: role === UserRole.PROFESSIONAL ? location : undefined,
        bio: role === UserRole.PROFESSIONAL ? bio : undefined,
        vatNumber: role === UserRole.PROFESSIONAL ? vatNumber : undefined,
        offeredServices: role === UserRole.PROFESSIONAL ? offeredServices : undefined,
      };

      await authService.signUp(email, password, userData);
      
      const profile = await authService.getCurrentUser();
      if (profile) {
        onLogin(profile);
        navigate('/dashboard');
      } else {
         setError('Account creato! Prova ad accedere dalla pagina di login.');
         setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      console.error("Registration Error Detail:", err);
      
      if (err.message && err.message.includes("confirmation email")) {
         setError("Errore configurazione: Disabilita 'Confirm Email' in Supabase.");
      } else if (err.message && err.message.includes("CONFLICT_PROFILE")) {
         setError("Questa email è già associata a un account. Prova ad accedere.");
      } else if (err.message && err.message.includes("already registered")) {
         setError("Email già registrata. Vai al login.");
      } else if (err.message && err.message.includes("Database error saving new user")) {
         // Messaggio user-friendly per errore tecnico
         setError("Errore tecnico del server durante la creazione profilo. Riprova con un'altra email o contatta l'assistenza.");
      } else if (err.message && err.message.includes("Password should be")) {
         setError("La password è troppo debole. Usa almeno 6 caratteri.");
      } else {
         setError(err.message || 'Errore sconosciuto durante la registrazione. Riprova.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-white">
      <div className="w-full max-w-[1250px] min-h-[700px] bg-white rounded-[32px] overflow-hidden flex flex-col lg:flex-row shadow-sm border border-slate-100">
        
        {/* Left Side (Marketing) */}
        <div className="lg:w-5/12 bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden m-2 rounded-[24px]">
           {/* Background Decorations */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/50 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none"></div>

           <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-12">
                 <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10"><Zap size={24} /></div>
                 <span className="font-bold text-2xl tracking-tight">{content.branding.platformName}</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-[1.1]">
                {role === UserRole.PROFESSIONAL ? 'Fai crescere il tuo business.' : 'Racconta cosa ti serve.'}
              </h1>
              
              <p className="text-indigo-100 text-lg leading-relaxed max-w-md opacity-90">
                La community di esperti digitali più attiva d'Italia ti aspetta.
              </p>

              <div className="mt-12 space-y-5">
                 {[
                   'Verifica istantanea',
                   role === UserRole.PROFESSIONAL ? 'Clienti di alta qualità' : 'Proposte mirate AI',
                   'Pagamenti sicuri',
                   'Zero costi fissi'
                 ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-3 group">
                       <div className="p-1.5 bg-white/20 rounded-full group-hover:bg-white group-hover:text-indigo-600 transition-colors"><Check size={14} /></div>
                       <span className="font-semibold">{item}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Testimonial Box Ridisegnato */}
           <div className="relative z-10 mt-auto pt-10 animate-in slide-in-from-bottom-8 duration-700">
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl">
                  <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
                      <span className="text-xs font-bold text-indigo-100 ml-2">4.9/5 da 10k+ utenti</span>
                  </div>
                  <blockquote className="text-lg font-medium leading-relaxed mb-6 text-white">
                      "Il miglior strumento per scalare la mia agenzia. Clienti seri e pagamenti sempre puntuali."
                  </blockquote>
                  <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                      <div className="flex -space-x-3 shrink-0">
                          <img src="https://i.pravatar.cc/100?img=33" className="w-10 h-10 rounded-full border-2 border-indigo-500" alt="User" />
                          <img src="https://i.pravatar.cc/100?img=47" className="w-10 h-10 rounded-full border-2 border-indigo-500" alt="User" />
                          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center text-indigo-600 text-[10px] font-black">+2k</div>
                      </div>
                      <div>
                          <div className="text-xs font-bold text-white">Unisciti ai Pro</div>
                          <div className="text-[10px] text-indigo-200 uppercase tracking-wider font-bold">Verifica immediata</div>
                      </div>
                  </div>
              </div>
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:w-7/12 p-8 lg:p-20 flex flex-col justify-center">
          <div className="max-w-xl mx-auto w-full">
            <div className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 mb-3">Crea Account</h2>
              <p className="text-slate-500 font-medium">Benvenuto su {content.branding.platformName}.</p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 border border-red-100">
                 <AlertCircle size={20} className="shrink-0" /> 
                 <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Role Selector */}
                <div className="grid grid-cols-2 gap-5">
                  <button 
                    onClick={() => setRole(UserRole.CLIENT)} 
                    className={`p-6 rounded-[24px] border-2 text-left transition-all duration-200 group ${role === UserRole.CLIENT ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <UserIcon size={28} className={`mb-4 ${role === UserRole.CLIENT ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <div className="font-black text-slate-900">Sono un Cliente</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Cerco Professionisti</div>
                  </button>
                  <button 
                    onClick={() => setRole(UserRole.PROFESSIONAL)} 
                    className={`p-6 rounded-[24px] border-2 text-left transition-all duration-200 group ${role === UserRole.PROFESSIONAL ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <Briefcase size={28} className={`mb-4 ${role === UserRole.PROFESSIONAL ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <div className="font-black text-slate-900">Sono un Pro</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Offro Servizi Digitali</div>
                  </button>
                </div>

                {/* Fields */}
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Nome Completo</label>
                    <div className="relative group">
                       <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                       <input 
                          type="text" 
                          placeholder="Mario Rossi" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          className="w-full pl-14 pr-6 py-4 bg-[#f0f0f0] border-2 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400" 
                          required 
                        />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Email Professionale</label>
                    <div className="relative group">
                       <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                       <input 
                          type="email" 
                          placeholder="email@esempio.it" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          className="w-full pl-14 pr-6 py-4 bg-[#f0f0f0] border-2 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400" 
                          required 
                        />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Telefono (Opzionale)</label>
                    <div className="relative group">
                       <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                       <input 
                          type="tel" 
                          placeholder="+39 333 1234567" 
                          value={phoneNumber} 
                          onChange={e => setPhoneNumber(e.target.value)} 
                          className="w-full pl-14 pr-6 py-4 bg-[#f0f0f0] border-2 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400" 
                        />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Password</label>
                    <div className="relative group">
                       <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                       <input 
                          type="password" 
                          placeholder="••••••••" 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          className="w-full pl-14 pr-6 py-4 bg-[#f0f0f0] border-2 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400" 
                          required 
                        />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && role === UserRole.PROFESSIONAL && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center space-x-3 mb-4">
                     <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                        <ArrowLeft size={20} />
                     </button>
                     <h3 className="font-bold text-xl text-slate-800">Dettagli Profilo Pro</h3>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Nome Brand / Agenzia</label>
                    <input 
                      type="text" 
                      placeholder="es. Digital Studio Srl" 
                      value={brandName} 
                      onChange={e => setBrandName(e.target.value)} 
                      className="w-full px-6 py-4 bg-[#f0f0f0] border-2 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Città</label>
                    <div className="relative group">
                       <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                       <input 
                          type="text" 
                          placeholder="Milano" 
                          value={location} 
                          onChange={e => setLocation(e.target.value)} 
                          className="w-full pl-14 pr-6 py-4 bg-[#f0f0f0] border-2 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400" 
                       />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Bio Breve</label>
                    <textarea 
                       placeholder="Descrivi in breve la tua esperienza..." 
                       value={bio} 
                       onChange={e => setBio(e.target.value)} 
                       rows={3}
                       className="w-full px-6 py-4 bg-[#f0f0f0] border-2 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 resize-none" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Partita IVA (Opzionale)</label>
                    <input 
                      type="text" 
                      placeholder="IT00000000000" 
                      value={vatNumber} 
                      onChange={e => setVatNumber(e.target.value)} 
                      className="w-full px-6 py-4 bg-[#f0f0f0] border-2 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400" 
                    />
                  </div>
               </div>
            )}

            {step === 3 && role === UserRole.PROFESSIONAL && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center space-x-3 mb-6">
                     <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                        <ArrowLeft size={20} />
                     </button>
                     <h3 className="font-bold text-xl text-slate-800">Le tue Competenze</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {contentService.getCategories().map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => toggleService(cat)} 
                        className={`p-4 border-2 rounded-2xl text-xs font-black transition-all ${
                          offeredServices.includes(cat) 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]' 
                            : 'bg-[#f0f0f0] border-transparent text-slate-500 hover:bg-white hover:border-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
               </div>
            )}

            <div className="mt-10">
              <button 
                onClick={handleNext}
                disabled={isLoading || !email || !password}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-[24px] hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all shadow-xl shadow-indigo-200 flex items-center justify-center text-lg group"
              >
                {isLoading ? (
                   <span className="flex items-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div> Registrazione...</span>
                ) : (
                   <span className="flex items-center">
                     {step === 3 || role === UserRole.CLIENT ? 'Crea Account' : 'Continua'} 
                     <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                   </span>
                )}
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <span className="text-slate-400 font-medium text-sm">Hai già un account?</span>{' '}
              <Link to="/login" className="text-indigo-600 font-black text-sm hover:underline">Accedi</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
