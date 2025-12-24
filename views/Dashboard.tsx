
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole, JobRequest, Quote, ServiceCategory, NotificationType, PlanType, FormDefinition, JobLocation } from '../types';
import { 
  LayoutGrid, FileText, Send, Settings, Plus, Search, Clock, CheckCircle, MessageSquare, Sparkles, TrendingUp, Filter, Code, Palette, Camera, Video, BarChart3, ShoppingCart, AppWindow, ArrowLeft, ArrowRight, ChevronRight, MapPin, Tag, Briefcase, Globe, CreditCard, Mail, Zap, Star, Trophy, Coins, History, CalendarDays, User as UserIcon, XCircle, AlertTriangle, ExternalLink, ShieldCheck, CreditCard as BillingIcon, Crown, Building2, Check, Eye, X, Phone, Download, Save, Lock, Image as ImageIcon, Edit3, Trash2, RefreshCcw, UserCheck, Upload, HelpCircle, Box
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { jobService } from '../services/jobService';
import { notificationService } from '../services/notificationService';
import { contentService } from '../services/contentService';
import { authService } from '../services/authService';
import ServiceForm from '../components/ServiceForm';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user: initialUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState<User>(initialUser);
  const isPro = user.role === UserRole.PROFESSIONAL;
  
  // Default tab logic based on role
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'quotes' | 'won' | 'settings' | 'billing' | 'my-requests'>(
    isPro ? 'leads' : 'my-requests'
  );

  // State for logic from other views (e.g. notifications redirect)
  useEffect(() => {
    if (location.state && (location.state as any).targetTab) {
      setActiveTab((location.state as any).targetTab);
    }
  }, [location]);
  
  // Modal & Detail states
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [modalStep, setModalStep] = useState<'category' | 'details' | 'budget'>('category');
  
  const [showQuoteModal, setShowQuoteModal] = useState<JobRequest | null>(null);
  const [viewingJobDetails, setViewingJobDetails] = useState<JobRequest | null>(null);
  const [viewingJobQuotes, setViewingJobQuotes] = useState<JobRequest | null>(null);
  
  // Job Form State
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobDetails, setJobDetails] = useState<Record<string, any>>({});
  const [budget, setBudget] = useState('');
  
  // Changed from object state to simple string
  const [locationCity, setLocationCity] = useState('');
  
  const [isRefining, setIsRefining] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);

  // Quote Form State
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState('');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);

  // Profile State
  const [profileForm, setProfileForm] = useState<User>(user);

  // Data State
  const [matchedLeads, setMatchedLeads] = useState<{ job: JobRequest; matchScore: number }[]>([]);
  const [myJobs, setMyJobs] = useState<JobRequest[]>([]);
  const [sentQuotes, setSentQuotes] = useState<Quote[]>([]);
  const [currentJobQuotes, setCurrentJobQuotes] = useState<Quote[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Async Data Fetching
  const refreshData = async () => {
    setIsLoadingData(true);
    try {
        // Refresh User
        const latestUser = await authService.getCurrentUser();
        if (latestUser) {
            setUser(latestUser);
            setProfileForm(latestUser);
        }

        // Refresh Categories
        setAvailableCategories(contentService.getCategories());

        if (isPro) {
            const matches = await jobService.getMatchesForPro(user);
            setMatchedLeads(matches);
            const allQuotes = await jobService.getQuotes();
            setSentQuotes(allQuotes.filter(q => q.proId === user.id));
        } else {
            const allJobs = await jobService.getJobs();
            setMyJobs(allJobs.filter(j => j.clientId === user.id));
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoadingData(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  useEffect(() => {
    if (viewingJobQuotes) {
      const loadQuotes = async () => {
          const qs = await jobService.getQuotesForJob(viewingJobQuotes.id);
          setCurrentJobQuotes(qs);
      };
      loadQuotes();
    }
  }, [viewingJobQuotes]);

  // --- Actions ---

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const def = contentService.getFormDefinition(category);
    setFormDefinition(def);
    setModalStep('details');
  };

  const handleRefineDescription = async () => {
    if (!jobDescription) return;
    setIsRefining(true);
    try {
      const refined = await geminiService.refineJobDescription(jobDescription);
      if (refined) setJobDescription(refined);
    } catch (err) { console.error(err); } 
    finally { setIsRefining(false); }
  };

  const handleCreateJob = async () => {
    if (!selectedCategory || !budget) return;
    setCreatingJob(true);
    try {
      await jobService.createJob({
        clientId: user.id,
        clientName: user.name,
        category: selectedCategory,
        description: jobDescription,
        details: jobDetails,
        budget: budget,
        // Send as object to match interface
        location: locationCity ? { city: locationCity } : undefined
      });
      
      // Reset and close
      setShowNewJobModal(false);
      setModalStep('category');
      setSelectedCategory(null);
      setJobDescription('');
      setJobDetails({});
      setBudget('');
      setLocationCity('');
      
      // Refresh list
      await refreshData();
    } catch (e: any) {
      console.error(e);
      alert(`Errore durante la creazione della richiesta: ${e.message || 'Riprova più tardi.'}`);
    } finally {
      setCreatingJob(false);
    }
  };

  const handleSendQuote = async () => {
    if (showQuoteModal && quotePrice && quoteMessage && quoteTimeline) {
      try {
        await jobService.sendQuote({
          jobId: showQuoteModal.id,
          proId: user.id,
          proName: user.name,
          price: parseFloat(quotePrice),
          message: quoteMessage,
          timeline: quoteTimeline
        });
        setShowQuoteModal(null);
        setQuotePrice('');
        setQuoteMessage('');
        setQuoteTimeline('');
        await refreshData();
        setActiveTab('quotes');
      } catch (err: any) {
        alert(err.message);
        if(err.message.includes("Crediti")) setActiveTab('billing');
      }
    }
  };

  const handleUpgrade = async (plan: PlanType) => {
    await jobService.updateUserPlan(user.id, plan);
    refreshData();
    alert(`Piano ${plan} attivato con successo!`);
  };
  
  const handleCloseJob = async (jobId: string) => {
    if (window.confirm("Vuoi davvero chiudere questa richiesta?")) {
      await jobService.updateJobStatus(jobId, 'CANCELLED');
      refreshData();
    }
  };

  // Helper for icons
  const getCategoryIcon = (name: string) => {
    switch(name) {
      case ServiceCategory.WEBSITE: return <Code size={28} />;
      case ServiceCategory.ECOMMERCE: return <ShoppingCart size={28} />;
      case ServiceCategory.DESIGN: return <Palette size={28} />;
      case ServiceCategory.BRANDING: return <Palette size={28} />;
      case ServiceCategory.PHOTOGRAPHY: return <Camera size={28} />;
      case ServiceCategory.VIDEO: return <Video size={28} />;
      case ServiceCategory.MARKETING: return <BarChart3 size={28} />;
      case ServiceCategory.SOFTWARE: return <AppWindow size={28} />;
      case ServiceCategory.THREE_D: return <Box size={28} />;
      default: return <FileText size={28} />;
    }
  };

  // Render Functions

  const renderMyRequests = () => {
    const activeCount = myJobs.filter(j => j.status === 'OPEN' || j.status === 'IN_PROGRESS').length;
    
    return (
      <div className="space-y-8 animate-in fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Le Mie Richieste</h2>
              <p className="text-slate-500 font-medium">Monitora le tue richieste di preventivo.</p>
           </div>
           
           <div className="flex items-center gap-4">
               {/* Stats Card */}
               <div className="bg-white px-6 py-3 rounded-[20px] border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                     <TrendingUp size={20} />
                  </div>
                  <div>
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progetti Attivi</div>
                     <div className="text-xl font-black text-slate-900 leading-none mt-1">{activeCount}</div>
                  </div>
               </div>

               <button 
                 onClick={() => {
                   setModalStep('category');
                   setShowNewJobModal(true);
                 }}
                 className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-[20px] hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center"
               >
                 <Plus className="mr-2" size={20} /> Chiedi un preventivo
               </button>
           </div>
        </div>

        {/* List */}
        <div className="grid gap-6">
           {myJobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                     <FileText size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Nessuna richiesta attiva</h3>
                  <p className="text-slate-500 mb-6">Inizia creando la tua prima richiesta di preventivo.</p>
                  <button 
                     onClick={() => { setModalStep('category'); setShowNewJobModal(true); }}
                     className="text-indigo-600 font-bold hover:underline"
                  >
                     Crea Richiesta
                  </button>
              </div>
           ) : (
              myJobs.map(job => (
                <div key={job.id} className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm hover:border-indigo-100 transition-all">
                   {/* Icon */}
                   <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                      {getCategoryIcon(job.category)}
                   </div>
                   
                   {/* Content */}
                   <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                         <h3 className="text-xl font-bold text-slate-900">{job.category}</h3>
                         <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 
                            job.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                            'bg-slate-100 text-slate-500'
                         }`}>
                            {job.status === 'OPEN' ? 'APERTA' : job.status}
                         </span>
                      </div>
                      <p className="text-slate-500 text-sm line-clamp-2 max-w-2xl mb-4 font-medium leading-relaxed">
                         {job.description}
                      </p>
                      
                      {/* Meta Footer */}
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                         <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>Pubblicata {new Date(job.createdAt).toLocaleDateString()}</span>
                         </div>
                         <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                         <div className="flex items-center gap-1.5">
                            <MessageSquare size={14} />
                            <span>Vedi Proposte</span>
                         </div>
                         {job.location && (
                           <>
                              <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                              <div className="flex items-center gap-1.5">
                                <MapPin size={14} />
                                <span>{job.location.city}</span>
                              </div>
                           </>
                         )}
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                      <button 
                        onClick={() => setViewingJobQuotes(job)}
                        className="w-full md:w-auto px-6 py-3 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center"
                      >
                         Gestisci Progetto <ChevronRight size={16} className="ml-2" />
                      </button>
                      {job.status === 'OPEN' && (
                        <div className="flex items-center gap-2 w-full md:w-auto justify-center">
                           <button className="p-3 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all" title="Modifica">
                              <Edit3 size={18} />
                              <span className="md:hidden ml-2 font-bold text-sm">Modifica</span>
                           </button>
                           <button onClick={() => handleCloseJob(job.id)} className="p-3 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all" title="Elimina">
                              <Trash2 size={18} />
                               <span className="md:hidden ml-2 font-bold text-sm">Elimina</span>
                           </button>
                        </div>
                      )}
                   </div>
                </div>
              ))
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-20 lg:w-80 border-r border-slate-100 bg-white flex flex-col p-8 sticky top-[73px] h-[calc(100vh-73px)] z-20">
        <div className="space-y-3 flex-grow">
          {[
            { id: 'leads', label: 'Opportunità', icon: <Star size={22} />, role: 'pro' },
            { id: 'my-requests', label: 'Mie Richieste', icon: <FileText size={22} />, role: 'client' },
            { id: 'quotes', label: 'Preventivi Inviati', icon: <Send size={22} />, role: 'pro' },
            { id: 'won', label: 'Lavori Ottenuti', icon: <Trophy size={22} />, role: 'pro' },
            { id: 'settings', label: 'Profilo & Servizi', icon: <Settings size={22} />, role: 'all' },
            { id: 'billing', label: 'Piani & Crediti', icon: <BillingIcon size={22} />, role: 'pro' }
          ]
          .filter(item => item.role === 'all' || (isPro && item.role === 'pro') || (!isPro && item.role === 'client'))
          .map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setViewingJobQuotes(null); setViewingJobDetails(null); }}
              className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}
            >
              <div className="shrink-0">{item.icon}</div>
              <span className="font-bold text-sm hidden lg:block">{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-10 lg:p-14 overflow-x-hidden">
        {activeTab !== 'my-requests' && (
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-2 leading-tight">
                {activeTab === 'leads' ? 'Opportunità' : activeTab === 'billing' ? 'Crediti' : 'Dashboard'}
              </h1>
              <p className="text-slate-400 font-medium text-lg">
                  {isLoadingData ? 'Caricamento dati in corso...' : 'Dati aggiornati.'}
              </p>
            </div>
          </header>
        )}

        {/* Content Render Logic */}
        {isLoadingData && matchedLeads.length === 0 && myJobs.length === 0 ? (
            <div className="py-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div></div>
        ) : (
            activeTab === 'leads' ? (
                <div className="space-y-6">
                    {matchedLeads.map(({ job, matchScore }) => (
                      <div key={job.id} className="group bg-white p-8 rounded-[24px] border border-slate-100 hover:border-indigo-100 transition-all shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                          <div className="flex items-start space-x-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                               {getCategoryIcon(job.category)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-black text-slate-900">{job.category}</h3>
                                <div className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                  <TrendingUp size={12} />
                                  <span className="text-[10px] font-black uppercase tracking-wider">{matchScore}% Match</span>
                                </div>
                              </div>
                              <p className="text-slate-600 text-sm mb-4 line-clamp-2 max-w-2xl font-medium leading-relaxed">{job.description}</p>
                              <div className="flex flex-wrap gap-3">
                                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  <MapPin size={14} />
                                  <span>{job.location?.city || 'Remoto'}</span>
                                </div>
                                <div className="w-1 h-1 bg-slate-200 rounded-full my-auto"></div>
                                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  <CreditCard size={14} />
                                  <span>Budget: {job.budget}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setViewingJobDetails(job); }}
                              className="w-full sm:w-auto px-6 py-4 bg-white border-2 border-slate-100 text-slate-600 font-bold rounded-2xl hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center"
                            >
                              <Eye size={18} className="mr-2" /> Dettagli
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuoteMessage('');
                                setQuotePrice('');
                                setQuoteTimeline('');
                                setShowQuoteModal(job);
                              }}
                              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center"
                            >
                              Invia Proposta <Send className="ml-2" size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {matchedLeads.length === 0 && <div className="text-center py-10 text-slate-400">Nessuna opportunità al momento.</div>}
                </div>
            ) : activeTab === 'my-requests' ? (
                renderMyRequests()
            ) : activeTab === 'billing' ? (
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                    <div className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-2">Bilancio Crediti</div>
                    <div className="text-7xl font-black mb-2 tracking-tighter">
                        {user.credits && user.credits >= 999 ? '∞' : (user.credits ?? 0)}
                    </div>
                    <button onClick={() => handleUpgrade('PRO')} className="mt-4 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold">Ricarica</button>
                </div>
            ) : (
                <div className="text-slate-500">Sezione in aggiornamento...</div>
            )
        )}

        {/* --- MODALS --- */}

        {/* New Job Modal */}
        {showNewJobModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900">
                         {modalStep === 'category' ? 'Nuova Richiesta' : selectedCategory}
                      </h3>
                      <p className="text-slate-500 text-sm font-medium">Passaggio {modalStep === 'category' ? '1' : modalStep === 'details' ? '2' : '3'} di 3</p>
                   </div>
                   <button onClick={() => setShowNewJobModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-red-500">
                      <X size={24} />
                   </button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
                   {modalStep === 'category' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                         {availableCategories.map(cat => (
                            <button 
                               key={cat}
                               onClick={() => handleCategorySelect(cat)}
                               className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all text-center gap-3"
                            >
                               <div className="text-indigo-600">{getCategoryIcon(cat)}</div>
                               <span className="font-bold text-slate-700 text-sm">{cat}</span>
                            </button>
                         ))}
                      </div>
                   )}

                   {modalStep === 'details' && formDefinition && (
                      <ServiceForm 
                         formDefinition={formDefinition}
                         description={jobDescription}
                         setDescription={setJobDescription}
                         details={jobDetails}
                         setDetails={setJobDetails}
                         onRefine={handleRefineDescription}
                         isRefining={isRefining}
                      />
                   )}

                   {modalStep === 'budget' && (
                      <div className="space-y-6">
                         <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Budget Stimato</label>
                            <div className="grid grid-cols-2 gap-4">
                               {(formDefinition?.budgetOptions || ['< 500€', '500 - 2k€', '2k - 5k€', '5k€+']).map(b => (
                                  <button 
                                     key={b}
                                     onClick={() => setBudget(b)}
                                     className={`py-5 px-4 rounded-[24px] text-sm font-black border-2 transition-all duration-200 ${
                                        budget === b 
                                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-200' 
                                        : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 bg-white'
                                     }`}
                                  >
                                     {b}
                                  </button>
                               ))}
                            </div>
                         </div>

                         <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Città (Opzionale)</label>
                            <div className="relative">
                               <MapPin className="absolute top-4 left-4 text-slate-400" size={20} />
                               <input 
                                 type="text" 
                                 value={locationCity}
                                 onChange={(e) => setLocationCity(e.target.value)}
                                 placeholder="es. Milano, Remoto, Roma..."
                                 className="w-full bg-white border-2 border-slate-200 rounded-[24px] py-4 pl-12 pr-6 text-sm font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all"
                               />
                            </div>
                         </div>
                      </div>
                   )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between">
                   {modalStep !== 'category' && (
                      <button 
                         onClick={() => setModalStep(modalStep === 'budget' ? 'details' : 'category')}
                         className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-white transition-all"
                      >
                         Indietro
                      </button>
                   )}
                   <div className="flex-grow"></div>
                   {modalStep === 'details' && (
                      <button 
                         onClick={() => setModalStep('budget')}
                         disabled={!jobDescription}
                         className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
                      >
                         Continua
                      </button>
                   )}
                   {modalStep === 'budget' && (
                      <button 
                         onClick={handleCreateJob}
                         disabled={!budget || creatingJob}
                         className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 flex items-center"
                      >
                         {creatingJob ? 'Pubblicazione...' : 'Pubblica Richiesta'}
                      </button>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* View Quotes Modal */}
        {viewingJobQuotes && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
              <div className="bg-white p-10 rounded-[24px] max-w-4xl w-full max-h-[90vh] flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-2xl font-black">Proposte Ricevute</h3>
                       <p className="text-slate-500 text-sm">per {viewingJobQuotes.category}</p>
                    </div>
                    <button onClick={() => setViewingJobQuotes(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={24}/></button>
                 </div>
                 
                 <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4">
                    {currentJobQuotes.length === 0 ? (
                       <div className="text-center py-20 text-slate-400">
                          Nessun preventivo ricevuto ancora.
                       </div>
                    ) : (
                       currentJobQuotes.map(quote => (
                          <div key={quote.id} className="p-6 border border-slate-200 rounded-2xl hover:border-indigo-200 transition-all">
                             <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                                      {quote.proName.charAt(0)}
                                   </div>
                                   <div>
                                      <div className="font-bold text-slate-900">{quote.proName}</div>
                                      <div className="text-xs text-slate-500">{new Date(quote.createdAt).toLocaleDateString()}</div>
                                   </div>
                                </div>
                                <div className="text-xl font-black text-indigo-600">€{quote.price}</div>
                             </div>
                             <p className="text-slate-600 text-sm mb-4 leading-relaxed bg-slate-50 p-4 rounded-xl">{quote.message}</p>
                             <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
                                <Clock size={14} /> Tempo stimato: {quote.timeline}
                             </div>
                             <div className="flex gap-4">
                                <button className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50">Chatta</button>
                                <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700">Accetta Preventivo</button>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* Send Quote Modal */}
        {showQuoteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
                <div className="bg-white p-10 rounded-[24px] max-w-2xl w-full">
                    <h3 className="text-2xl font-black mb-4">Invia Preventivo</h3>
                    <input type="number" placeholder="Prezzo (€)" value={quotePrice} onChange={e=>setQuotePrice(e.target.value)} className="w-full p-4 border rounded-xl mb-4 font-bold" />
                    <textarea placeholder="Messaggio per il cliente..." value={quoteMessage} onChange={e=>setQuoteMessage(e.target.value)} className="w-full p-4 border rounded-xl mb-4 text-sm" rows={4} />
                    <input type="text" placeholder="Tempistiche (es. 2 settimane)" value={quoteTimeline} onChange={e=>setQuoteTimeline(e.target.value)} className="w-full p-4 border rounded-xl mb-4 font-bold" />
                    <div className="flex gap-4">
                        <button onClick={()=>setShowQuoteModal(null)} className="flex-1 py-3 border rounded-xl font-bold">Annulla</button>
                        <button onClick={handleSendQuote} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Invia Proposta</button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
