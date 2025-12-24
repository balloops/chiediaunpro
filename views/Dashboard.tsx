
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole, JobRequest, Quote, ServiceCategory, NotificationType, PlanType, FormDefinition, JobLocation } from '../types';
import { 
  LayoutGrid, FileText, Send, Settings, Plus, Search, Clock, CheckCircle, MessageSquare, Sparkles, TrendingUp, Filter, Code, Palette, Camera, Video, BarChart3, ShoppingCart, AppWindow, ArrowLeft, ArrowRight, ChevronRight, MapPin, Tag, Briefcase, Globe, CreditCard, Mail, Zap, Star, Trophy, Coins, History, CalendarDays, User as UserIcon, XCircle, AlertTriangle, ExternalLink, ShieldCheck, CreditCard as BillingIcon, Crown, Building2, Check, Eye, X, Phone, Download, Save, Lock, Image as ImageIcon, Edit3, Trash2, RefreshCcw, UserCheck, Upload, HelpCircle, Box, Wallet
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

  // State for logic from other views
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
  const [locationCity, setLocationCity] = useState('');
  
  const [isRefining, setIsRefining] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);

  // Quote Form State
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState('');

  // Profile State
  const [profileForm, setProfileForm] = useState<User>(user);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Data State
  const [matchedLeads, setMatchedLeads] = useState<{ job: JobRequest; matchScore: number }[]>([]);
  const [myJobs, setMyJobs] = useState<JobRequest[]>([]);
  const [sentQuotes, setSentQuotes] = useState<Quote[]>([]);
  const [currentJobQuotes, setCurrentJobQuotes] = useState<Quote[]>([]);
  const [allJobsForQuotes, setAllJobsForQuotes] = useState<JobRequest[]>([]); // To resolve job details for quotes
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
            // Fetch all jobs to allow mapping job details in quotes tab
            const allJobs = await jobService.getJobs();
            setAllJobsForQuotes(allJobs);
            
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
        location: locationCity ? { city: locationCity } : undefined
      });
      
      setShowNewJobModal(false);
      setModalStep('category');
      setSelectedCategory(null);
      setJobDescription('');
      setJobDetails({});
      setBudget('');
      setLocationCity('');
      await refreshData();
    } catch (e: any) {
      console.error(e);
      alert(`Errore: ${e.message}`);
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
          proName: user.brandName || user.name,
          price: parseFloat(quotePrice),
          message: quoteMessage,
          timeline: quoteTimeline,
          clientOwnerId: showQuoteModal.clientId, // Useful for future server-side notifs
          category: showQuoteModal.category
        });

        // Trigger Notification Locally (Simulation)
        notificationService.notifyNewQuote(
           showQuoteModal.clientId, 
           user.brandName || user.name, 
           showQuoteModal.category, 
           showQuoteModal.id
        );

        setShowQuoteModal(null);
        setQuotePrice('');
        setQuoteMessage('');
        setQuoteTimeline('');
        await refreshData();
        setActiveTab('quotes');
        alert("Preventivo inviato con successo!");
      } catch (err: any) {
        alert(err.message);
        if(err.message.includes("Crediti")) setActiveTab('billing');
      }
    }
  };

  const handleAcceptQuote = async (quote: Quote) => {
     if(window.confirm("Confermi di voler accettare questo preventivo?")) {
        try {
           // 1. Update status
           await jobService.updateQuoteStatus(quote, 'ACCEPTED');
           
           // 2. Notify Pro
           notificationService.notifyQuoteAccepted(quote.proId, user.name, quote.id);
           
           alert("Preventivo accettato! Il professionista riceverà una notifica.");
           setViewingJobQuotes(null);
           refreshData();
        } catch (e) {
           console.error(e);
           alert("Errore durante l'accettazione.");
        }
     }
  };

  const handleSaveProfile = async () => {
     setIsSavingProfile(true);
     try {
        await jobService.updateUserProfile(user.id, {
           name: profileForm.name,
           brandName: profileForm.brandName,
           location: profileForm.location,
           // Add other fields if needed
        });
        await refreshData();
        alert("Profilo aggiornato con successo!");
     } catch(e) {
        console.error(e);
        alert("Errore salvataggio profilo.");
     } finally {
        setIsSavingProfile(false);
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
      case ServiceCategory.WEBSITE: return <Code size={24} />;
      case ServiceCategory.ECOMMERCE: return <ShoppingCart size={24} />;
      case ServiceCategory.DESIGN: return <Palette size={24} />;
      case ServiceCategory.BRANDING: return <Palette size={24} />;
      case ServiceCategory.PHOTOGRAPHY: return <Camera size={24} />;
      case ServiceCategory.VIDEO: return <Video size={24} />;
      case ServiceCategory.MARKETING: return <BarChart3 size={24} />;
      case ServiceCategory.SOFTWARE: return <AppWindow size={24} />;
      case ServiceCategory.THREE_D: return <Box size={24} />;
      default: return <FileText size={24} />;
    }
  };

  const getJobForQuote = (jobId: string) => allJobsForQuotes.find(j => j.id === jobId);

  // Render Functions

  const renderDigitalProCard = () => (
     <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 mt-auto">
        <div className="flex items-center space-x-2 mb-3">
           <Zap className="text-amber-500 fill-amber-500" size={16} />
           <span className="text-xs font-black uppercase tracking-widest text-slate-900">Digital Pro Card</span>
        </div>
        <div className="flex justify-between items-end mb-2">
           <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Crediti</div>
              <div className="text-lg font-black text-slate-900 leading-none">{user.credits}</div>
           </div>
           <button 
             onClick={() => setActiveTab('billing')}
             className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
           >
              Ricarica
           </button>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
           <div className="bg-indigo-600 h-full w-[70%]"></div>
        </div>
        <div className="text-[10px] font-bold text-slate-400">70% Profilo Completato</div>
     </div>
  );

  const renderQuotesTab = (filter: 'ALL' | 'WON') => {
    const quotesToShow = filter === 'WON' 
        ? sentQuotes.filter(q => q.status === 'ACCEPTED') 
        : sentQuotes;
    
    // Sort by date desc
    quotesToShow.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
       <div className="space-y-6 animate-in fade-in">
          {quotesToShow.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                   {filter === 'WON' ? <Trophy size={32} /> : <Send size={32} />}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                   {filter === 'WON' ? 'Nessun lavoro vinto ancora' : 'Nessun preventivo inviato'}
                </h3>
                <p className="text-slate-500 mb-6">
                   {filter === 'WON' ? 'Invia più preventivi per aumentare le tue chance!' : 'Cerca nuove opportunità e candidati.'}
                </p>
                <button onClick={() => setActiveTab('leads')} className="text-indigo-600 font-bold hover:underline">Vai alle Opportunità</button>
             </div>
          ) : (
             quotesToShow.map(quote => {
                const job = getJobForQuote(quote.jobId);
                return (
                   <div key={quote.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:border-indigo-100 transition-all">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${filter === 'WON' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                         {filter === 'WON' ? <FileText size={24} /> : <FileText size={24} />}
                      </div>
                      
                      <div className="flex-grow w-full">
                         <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-black text-slate-900">{job?.category || 'Progetto'}</h3>
                            {quote.status === 'ACCEPTED' && (
                               <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                  {filter === 'WON' ? 'Lavoro Vinto!' : 'Accettato'}
                               </span>
                            )}
                            {quote.status === 'PENDING' && (
                               <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                  In Attesa
                               </span>
                            )}
                         </div>
                         <p className="text-slate-500 text-sm font-medium line-clamp-1 mb-3">
                            {job?.description || 'Dettagli non disponibili'}
                         </p>
                         
                         <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {job?.location?.city && (
                               <div className="flex items-center gap-1.5">
                                  <MapPin size={12} /> {job.location.city}
                               </div>
                            )}
                            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                               {filter === 'WON' ? 'Accettato:' : 'Offerta:'} {quote.price}€
                            </div>
                            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                               <Clock size={12} /> {filter === 'WON' ? 'Vinto:' : 'Inviato:'} {new Date(quote.createdAt).toLocaleDateString()}
                            </div>
                         </div>
                      </div>

                      <div className="w-full md:w-auto flex justify-end">
                         <button className="px-5 py-2.5 border-2 border-slate-100 rounded-xl font-bold text-slate-600 text-sm hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center">
                            <Eye size={16} className="mr-2" /> Dettagli
                         </button>
                      </div>
                   </div>
                );
             })
          )}
       </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-20 lg:w-80 border-r border-slate-100 bg-white flex flex-col p-6 sticky top-[73px] h-[calc(100vh-73px)] z-20">
        <div className="space-y-2 flex-grow">
          {[
            { id: 'leads', label: 'Opportunità', icon: <Star size={20} />, role: 'pro' },
            { id: 'my-requests', label: 'Mie Richieste', icon: <FileText size={20} />, role: 'client' },
            { id: 'quotes', label: 'Preventivi Inviati', icon: <Send size={20} />, role: 'pro' },
            { id: 'won', label: 'Lavori Ottenuti', icon: <Trophy size={20} />, role: 'pro', badge: sentQuotes.filter(q => q.status === 'ACCEPTED').length },
            { id: 'settings', label: 'Profilo & Servizi', icon: <Settings size={20} />, role: 'all' },
            { id: 'billing', label: 'Piani & Crediti', icon: <BillingIcon size={20} />, role: 'pro' }
          ]
          .filter(item => item.role === 'all' || (isPro && item.role === 'pro') || (!isPro && item.role === 'client'))
          .map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setViewingJobQuotes(null); setViewingJobDetails(null); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600 font-medium'}`}
            >
              <div className="flex items-center space-x-3">
                 <div className="shrink-0">{item.icon}</div>
                 <span className="font-bold text-sm hidden lg:block">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                 <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full hidden lg:block">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
        
        {/* Digital Pro Card at bottom of sidebar for Pros */}
        {isPro && renderDigitalProCard()}
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 lg:p-12 overflow-x-hidden">
        {activeTab !== 'my-requests' && (
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
                {activeTab === 'leads' ? 'Opportunità' : 
                 activeTab === 'quotes' ? 'Preventivi Inviati' :
                 activeTab === 'won' ? 'I tuoi Successi' :
                 activeTab === 'settings' ? `${user.brandName || user.name}` :
                 activeTab === 'billing' ? 'Crediti' : 'Dashboard'}
              </h1>
              <p className="text-slate-400 font-medium text-lg">
                  {activeTab === 'leads' ? 'Trova nuovi clienti e invia proposte.' :
                   activeTab === 'quotes' ? 'Bentornato Pro. Fai crescere il tuo business.' :
                   activeTab === 'won' ? 'Bentornato Pro. Fai crescere il tuo business.' :
                   activeTab === 'settings' ? 'Professionista Verificato' :
                   isLoadingData ? 'Caricamento dati in corso...' : 'Dati aggiornati.'}
              </p>
            </div>

            {(activeTab === 'quotes' || activeTab === 'won') && (
               <div className="bg-white px-6 py-3 rounded-[20px] border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                     <Coins size={20} />
                  </div>
                  <div>
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crediti Disponibili</div>
                     <div className="text-xl font-black text-slate-900 leading-none mt-1">{user.credits}</div>
                  </div>
               </div>
            )}
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
                // My Requests logic handled in sub-render function previously, moved here for clarity
                <div className="space-y-8 animate-in fade-in">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                      <div>
                         <h2 className="text-3xl font-black text-slate-900 mb-2">Le Mie Richieste</h2>
                         <p className="text-slate-500 font-medium">Monitora le tue richieste di preventivo.</p>
                      </div>
                      <div className="flex items-center gap-4">
                          <button 
                            onClick={() => { setModalStep('category'); setShowNewJobModal(true); }}
                            className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-[20px] hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center"
                          >
                            <Plus className="mr-2" size={20} /> Chiedi un preventivo
                          </button>
                      </div>
                   </div>
                   <div className="grid gap-6">
                      {myJobs.length === 0 ? (
                         <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-200">
                             <h3 className="text-lg font-bold text-slate-900 mb-1">Nessuna richiesta attiva</h3>
                             <button onClick={() => { setModalStep('category'); setShowNewJobModal(true); }} className="text-indigo-600 font-bold hover:underline">Crea Richiesta</button>
                         </div>
                      ) : (
                         myJobs.map(job => (
                           <div key={job.id} className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm hover:border-indigo-100 transition-all">
                              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                                 {getCategoryIcon(job.category)}
                              </div>
                              <div className="flex-grow">
                                 <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-slate-900">{job.category}</h3>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{job.status}</span>
                                 </div>
                                 <p className="text-slate-500 text-sm line-clamp-2 max-w-2xl mb-4 font-medium leading-relaxed">{job.description}</p>
                                 <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                    <div className="flex items-center gap-1.5"><Clock size={14} /><span>{new Date(job.createdAt).toLocaleDateString()}</span></div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3 w-full md:w-auto">
                                 <button onClick={() => setViewingJobQuotes(job)} className="w-full md:w-auto px-6 py-3 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center">Gestisci <ChevronRight size={16} className="ml-2" /></button>
                              </div>
                           </div>
                         ))
                      )}
                   </div>
                </div>
            ) : activeTab === 'billing' ? (
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                    <div className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-2">Bilancio Crediti</div>
                    <div className="text-7xl font-black mb-2 tracking-tighter">
                        {user.credits && user.credits >= 999 ? '∞' : (user.credits ?? 0)}
                    </div>
                    <button onClick={() => handleUpgrade('PRO')} className="mt-4 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold">Ricarica</button>
                </div>
            ) : activeTab === 'settings' ? (
                <div className="max-w-4xl space-y-8 animate-in fade-in">
                   {/* Profile Header Card */}
                   <div className="bg-white p-8 rounded-[24px] border border-slate-100 flex items-center gap-6">
                      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center font-black text-2xl">
                         {user.brandName ? user.brandName.substring(0,2).toUpperCase() : user.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-slate-900">{user.brandName || user.name}</h2>
                         <div className="text-slate-500 text-sm font-medium mt-1">Professionista Verificato</div>
                      </div>
                      <div className="ml-auto">
                         <button 
                            onClick={handleSaveProfile} 
                            disabled={isSavingProfile}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                         >
                            {isSavingProfile ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Save size={18} />}
                            <span>Salva Modifiche</span>
                         </button>
                      </div>
                   </div>

                   {/* Edit Form */}
                   <div className="bg-white p-8 rounded-[24px] border border-slate-100 space-y-6">
                      <div>
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome Completo</label>
                         <input 
                           type="text" 
                           value={profileForm.name} 
                           onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all"
                         />
                      </div>
                      <div>
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome Brand / Agenzia</label>
                         <input 
                           type="text" 
                           value={profileForm.brandName || ''} 
                           onChange={e => setProfileForm({...profileForm, brandName: e.target.value})}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all"
                         />
                      </div>
                      <div>
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Email (Non modificabile)</label>
                         <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={profileForm.email} 
                              disabled
                              className="w-full pl-12 p-4 bg-slate-100 border border-slate-200 rounded-2xl font-medium text-slate-500 cursor-not-allowed"
                            />
                         </div>
                      </div>
                      <div>
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Località</label>
                         <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={profileForm.location || ''} 
                              onChange={e => setProfileForm({...profileForm, location: e.target.value})}
                              className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Support Banner */}
                   <div className="bg-white p-6 rounded-[24px] border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <HelpCircle size={24} />
                         </div>
                         <div>
                            <h3 className="font-bold text-slate-900">Supporto & Assistenza</h3>
                            <p className="text-xs text-slate-500">Hai domande? Trova le risposte nella nostra Knowledge Base.</p>
                         </div>
                      </div>
                      <Link to="/help" className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                         <span>Vai al Centro Assistenza</span>
                         <ArrowRight size={16} />
                      </Link>
                   </div>
                </div>
            ) : activeTab === 'quotes' ? (
               renderQuotesTab('ALL')
            ) : activeTab === 'won' ? (
               renderQuotesTab('WON')
            ) : null
        )}

        {/* --- MODALS --- */}

        {/* New Job Modal (Code identical to previous, kept for context) */}
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

        {/* View Quotes Modal (Client Side) */}
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
                                {quote.status === 'ACCEPTED' ? (
                                    <button disabled className="flex-1 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold">Preventivo Accettato</button>
                                ) : (
                                    <button 
                                      onClick={() => handleAcceptQuote(quote)}
                                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                                    >
                                       Accetta Preventivo
                                    </button>
                                )}
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* Send Quote Modal (Pro Side) */}
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
