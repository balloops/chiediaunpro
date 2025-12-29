
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { User, UserRole, JobRequest, Quote, ServiceCategory, NotificationType, PlanType, FormDefinition, JobLocation } from '../types';
import { 
  LayoutGrid, FileText, Send, Settings, Plus, Search, Clock, CheckCircle, MessageSquare, Sparkles, TrendingUp, Filter, Code, Palette, Camera, Video, BarChart3, ShoppingCart, AppWindow, ArrowLeft, ArrowRight, ChevronRight, MapPin, Tag, Briefcase, Globe, CreditCard, Mail, Zap, Star, Trophy, Coins, History, CalendarDays, User as UserIcon, XCircle, AlertTriangle, ExternalLink, ShieldCheck, CreditCard as BillingIcon, Crown, Building2, Check, Eye, X, Phone, Download, Save, Lock, Image as ImageIcon, Edit3, Trash2, RefreshCcw, UserCheck, Upload, HelpCircle, Box, Wallet, Calendar, Euro
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { jobService } from '../services/jobService';
import { notificationService } from '../services/notificationService';
import { contentService } from '../services/contentService';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import ServiceForm from '../components/ServiceForm';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState<User>(initialUser);
  const isPro = user.role === UserRole.PROFESSIONAL;
  
  // Default tab logic based on role
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'quotes' | 'won' | 'settings' | 'billing' | 'my-requests'>(
    isPro ? 'leads' : 'my-requests'
  );

  
  // Modal & Detail states
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [modalStep, setModalStep] = useState<'category' | 'details' | 'budget'>('category');
  
  const [showQuoteModal, setShowQuoteModal] = useState<JobRequest | null>(null);
  const [viewingJobDetails, setViewingJobDetails] = useState<JobRequest | null>(null);
  const [viewingJobQuotes, setViewingJobQuotes] = useState<JobRequest | null>(null);
  
  // Quote Detail Full View State
  const [viewingQuoteDetail, setViewingQuoteDetail] = useState<{ quote: Quote, job: JobRequest } | null>(null);
  const [contactInfo, setContactInfo] = useState<User | null>(null);

  // Job Form State
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobDetails, setJobDetails] = useState<Record<string, any>>({});
  const [budget, setBudget] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null); // NEW: Track editing job
  
  const [isRefining, setIsRefining] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);

  // Quote Form State
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState('');
  // Validation State for Quote
  const [quoteTouched, setQuoteTouched] = useState({ price: false, message: false, timeline: false });

  // Profile State
  const [profileForm, setProfileForm] = useState<User>(user);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Data State
  const [matchedLeads, setMatchedLeads] = useState<{ job: JobRequest; matchScore: number }[]>([]);
  const [myJobs, setMyJobs] = useState<JobRequest[]>([]);
  const [sentQuotes, setSentQuotes] = useState<Quote[]>([]);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]); // NEW: Store all quotes for client's jobs
  const [currentJobQuotes, setCurrentJobQuotes] = useState<Quote[]>([]);
  const [allJobsForQuotes, setAllJobsForQuotes] = useState<JobRequest[]>([]); // To resolve job details for quotes
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Async Data Fetching - Wrapped in useCallback for dependency stability
  const refreshData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingData(true);
    try {
        // Refresh User to keep credits/profile sync
        const latestUser = await authService.getCurrentUser();
        if (latestUser) {
            setUser(latestUser);
            setProfileForm(latestUser); // Keep profile form in sync
        }

        // Refresh Categories
        setAvailableCategories(contentService.getCategories());

        if (latestUser?.role === UserRole.PROFESSIONAL) {
            const matches = await jobService.getMatchesForPro(latestUser);
            setMatchedLeads(matches);
            const allQuotes = await jobService.getQuotes();
            // Fetch all jobs to allow mapping job details in quotes tab
            const allJobs = await jobService.getJobs();
            setAllJobsForQuotes(allJobs);
            
            setSentQuotes(allQuotes.filter(q => q.proId === latestUser.id));
        } else if (latestUser) {
            const allJobs = await jobService.getJobs();
            const myJobsFiltered = allJobs.filter(j => j.clientId === latestUser.id);
            setMyJobs(myJobsFiltered);
            
            // Fetch all quotes to determine status and counts for My Requests
            const allQuotes = await jobService.getQuotes();
            // Filter quotes that belong to any of my jobs
            const myJobIds = new Set(myJobsFiltered.map(j => j.id));
            setClientQuotes(allQuotes.filter(q => myJobIds.has(q.jobId)));
        }
    } catch (e) {
        console.error(e);
    } finally {
        if (showLoading) setIsLoadingData(false);
    }
  }, []); // Empty deps because we fetch user inside or use args. 
  // Actually, 'isPro' logic depends on the fetched user, so we are good.

  // Initial Fetch & Tab Handling
  useEffect(() => {
    refreshData(true);
  }, [activeTab, refreshData]);

  // Handle Navigation State (e.g. from Notification)
  useEffect(() => {
    if (location.state && (location.state as any).targetTab) {
      setActiveTab((location.state as any).targetTab);
      // If navigating from notification, force a silent refresh to ensure data is there
      if ((location.state as any).fromNotification) {
        refreshData(false);
      }
    }
  }, [location, refreshData]);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('dashboard_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        () => {
           console.log("Realtime: Job change detected. Refreshing...");
           refreshData(false); // Silent refresh
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes' },
        () => {
           console.log("Realtime: Quote change detected. Refreshing...");
           refreshData(false); // Silent refresh
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  useEffect(() => {
    if (viewingJobQuotes) {
      const loadQuotes = async () => {
          const qs = await jobService.getQuotesForJob(viewingJobQuotes.id);
          setCurrentJobQuotes(qs);
      };
      loadQuotes();
    }
  }, [viewingJobQuotes]);

  // Fetch Contact Info when viewing Quote Detail
  useEffect(() => {
    const fetchContacts = async () => {
      if (viewingQuoteDetail && viewingQuoteDetail.quote.status === 'ACCEPTED') {
        const targetUserId = isPro ? viewingQuoteDetail.job.clientId : viewingQuoteDetail.quote.proId;
        const profile = await jobService.getUserProfile(targetUserId);
        setContactInfo(profile);
      } else {
        setContactInfo(null);
      }
    };
    fetchContacts();
  }, [viewingQuoteDetail, isPro]);

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
      if (editingJobId) {
         // Update existing job
         await jobService.updateJobDetails(editingJobId, {
            description: jobDescription,
            details: jobDetails,
            budget: budget,
            location: locationCity ? { city: locationCity } : undefined
         });
         alert("Richiesta aggiornata con successo!");
      } else {
         // Create new job
         await jobService.createJob({
            clientId: user.id,
            clientName: user.name,
            category: selectedCategory,
            description: jobDescription,
            details: jobDetails,
            budget: budget,
            location: locationCity ? { city: locationCity } : undefined
         });
      }
      
      setShowNewJobModal(false);
      resetJobForm();
      await refreshData();
    } catch (e: any) {
      console.error(e);
      alert(`Errore: ${e.message}`);
    } finally {
      setCreatingJob(false);
    }
  };

  const resetJobForm = () => {
      setModalStep('category');
      setSelectedCategory(null);
      setJobDescription('');
      setJobDetails({});
      setBudget('');
      setLocationCity('');
      setEditingJobId(null);
  };

  const handleEditJob = (job: JobRequest) => {
     setEditingJobId(job.id);
     setSelectedCategory(job.category);
     const def = contentService.getFormDefinition(job.category);
     setFormDefinition(def);
     
     setJobDescription(job.description);
     setJobDetails(job.details || {});
     setBudget(job.budget || '');
     setLocationCity(job.location?.city || '');
     
     setModalStep('details'); // Skip category selection for edit
     setShowNewJobModal(true);
  };

  const handleDeleteJob = async (jobId: string) => {
     if(window.confirm("Sei sicuro di voler eliminare questa richiesta? L'azione è irreversibile.")) {
        await jobService.deleteJob(jobId);
        refreshData();
     }
  };

  const handleSendQuote = async () => {
    // Validation check
    if (!quotePrice || !quoteMessage || !quoteTimeline) return;

    if (showQuoteModal) {
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

        // Trigger Notification DB
        await notificationService.notifyNewQuote(
           showQuoteModal.clientId, 
           user.brandName || user.name, 
           showQuoteModal.category, 
           showQuoteModal.id
        );

        setShowQuoteModal(null);
        setQuotePrice('');
        setQuoteMessage('');
        setQuoteTimeline('');
        setQuoteTouched({ price: false, message: false, timeline: false });
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
           await notificationService.notifyQuoteAccepted(quote.proId, user.name, quote.id);
           
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

  const handleOpenQuoteDetail = (quote: Quote) => {
    const job = isPro ? allJobsForQuotes.find(j => j.id === quote.jobId) : myJobs.find(j => j.id === quote.jobId);
    // If client, job is in myJobs or we have viewingJobQuotes
    const jobData = job || (viewingJobQuotes?.id === quote.jobId ? viewingJobQuotes : null);
    
    if (jobData) {
      setViewingQuoteDetail({ quote, job: jobData });
      setViewingJobQuotes(null); // Close modal if open
    } else {
      console.error("Job data missing for quote detail");
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

  // Quote Validation Logic
  const isQuotePriceValid = !!quotePrice && parseFloat(quotePrice) > 0;
  const isQuoteTimelineValid = !!quoteTimeline.trim();
  const isQuoteMessageValid = !!quoteMessage.trim();
  const isQuoteFormValid = isQuotePriceValid && isQuoteTimelineValid && isQuoteMessageValid;

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

  const renderQuoteDetailView = () => {
    if (!viewingQuoteDetail) return null;
    const { quote, job } = viewingQuoteDetail;
    const isAccepted = quote.status === 'ACCEPTED';
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
        <header className="mb-8">
           <button 
             onClick={() => { setViewingQuoteDetail(null); setContactInfo(null); }}
             className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 mb-4 transition-colors font-bold text-sm"
           >
              <ArrowLeft size={16} />
              <span>Torna indietro</span>
           </button>
           <h1 className="text-3xl font-black text-slate-900 mb-2">Dettaglio Preventivo</h1>
           <p className="text-slate-400 font-medium text-lg">
             {isAccepted ? 'Ottime notizie! Ecco i dettagli per iniziare a lavorare.' : 'Riepilogo della tua proposta.'}
           </p>
        </header>
        
        <div className="flex items-center space-x-4 mb-8">
           <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-500">ID: {quote.id.substring(0,8)}</div>
           {isAccepted && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-wider">Accettato</span>}
           {quote.status === 'PENDING' && <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-black uppercase tracking-wider">In Attesa</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Left Col: Job Request */}
           <div className="bg-white p-8 rounded-[24px] border border-slate-100 h-fit">
              <div className="flex items-center gap-3 mb-6">
                 <FileText className="text-slate-400" size={24} />
                 <h3 className="font-black text-lg text-slate-900">Richiesta del Cliente</h3>
              </div>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Categoria</label>
                    <div className="font-bold text-slate-900 text-lg">{job.category}</div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Descrizione</label>
                    <p className="text-slate-600 text-sm leading-relaxed">{job.description}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Budget Stimato</label>
                       <div className="font-bold text-slate-900">{job.budget}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Città</label>
                       <div className="font-bold text-slate-900">{job.location?.city || 'Remoto'}</div>
                    </div>
                 </div>
                 {job.details && Object.keys(job.details).length > 0 && (
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Dettagli Tecnici</label>
                       <div className="flex flex-wrap gap-2">
                          {Object.entries(job.details).map(([key, val]) => (
                             <span key={key} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 bg-white">
                                <span className="text-slate-400 mr-1">{key}:</span> {Array.isArray(val) ? val.join(', ') : val}
                             </span>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           </div>

           {/* Right Col: Contact & Quote */}
           <div className="space-y-8">
              {/* Contact Card (Only if Accepted) */}
              {isAccepted ? (
                 <div className="bg-emerald-50 p-8 rounded-[24px] border border-emerald-100">
                    <div className="flex items-center gap-3 mb-6">
                       <UserIcon className="text-emerald-600" size={24} />
                       <h3 className="font-black text-lg text-emerald-900">Contatti {isPro ? 'del Cliente' : 'del Professionista'}</h3>
                    </div>
                    
                    {contactInfo ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                             <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1 block">Nome {isPro ? 'Cliente' : 'Pro'}</label>
                             <div className="font-bold text-emerald-950 text-lg">{contactInfo.brandName || contactInfo.name}</div>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1 block">Email</label>
                             <div className="font-bold text-emerald-950 text-sm break-all underline decoration-emerald-300 underline-offset-2">{contactInfo.email}</div>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1 block">Telefono</label>
                             <div className="font-bold text-emerald-950 flex items-center gap-2">
                                <Phone size={14} className="text-emerald-600" />
                                {contactInfo.phoneNumber || 'Non disponibile'}
                             </div>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1 block">Contratto</label>
                             <button className="flex items-center text-emerald-700 font-bold text-sm hover:underline">
                                <Download size={14} className="mr-1" /> Scarica Bozza
                             </button>
                          </div>
                       </div>
                    ) : (
                       <div className="flex items-center justify-center py-4 text-emerald-700">
                          <div className="animate-spin mr-2 w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full"></div>
                          Caricamento contatti...
                       </div>
                    )}
                 </div>
              ) : (
                <div className="bg-slate-100 p-6 rounded-[24px] text-center border border-slate-200">
                   <Lock className="mx-auto text-slate-400 mb-2" size={24} />
                   <h3 className="font-bold text-slate-600">Contatti Nascosti</h3>
                   <p className="text-xs text-slate-400 mt-1">I dati di contatto saranno visibili solo dopo l'accettazione del preventivo.</p>
                </div>
              )}

              {/* Quote Summary */}
              <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                 
                 <div className="flex items-center gap-3 mb-6 relative z-10">
                    <Send className="text-indigo-600" size={24} />
                    <h3 className="font-black text-lg text-slate-900">{isPro ? 'Il tuo Preventivo' : 'Preventivo Ricevuto'}</h3>
                 </div>

                 <div className="grid grid-cols-2 gap-8 mb-6 relative z-10">
                    <div>
                       <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 block">Prezzo Offerto</label>
                       <div className="text-3xl font-black text-indigo-600">{quote.price} €</div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tempistiche</label>
                       <div className="text-xl font-bold text-slate-900">{quote.timeline}</div>
                    </div>
                 </div>

                 <div className="relative z-10">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Messaggio al Cliente</label>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 italic">
                       "{quote.message}"
                    </div>
                 </div>
                 
                 {quote.status === 'ACCEPTED' && (
                    <div className="mt-6 flex justify-end relative z-10">
                       <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center">
                          <Check size={14} className="mr-1" /> Accettato il {new Date().toLocaleDateString()}
                       </span>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    );
  };

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
                         <button 
                            onClick={() => handleOpenQuoteDetail(quote)}
                            className="px-5 py-2.5 border-2 border-slate-100 rounded-xl font-bold text-slate-600 text-sm hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center"
                         >
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
      <aside className="w-20 lg:w-80 border-r border-slate-100 bg-white flex flex-col p-6 sticky top-[73px] h-[calc(100vh-73px)] z-20 shrink-0">
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
              onClick={() => { setActiveTab(item.id as any); setViewingJobQuotes(null); setViewingJobDetails(null); setViewingQuoteDetail(null); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${activeTab === item.id && !viewingQuoteDetail ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600 font-medium'}`}
            >
              <div className="flex items-center space-x-3">
                 <div className="shrink-0">{item.icon}</div>
                 <span className="font-bold text-sm hidden lg:block whitespace-nowrap">{item.label}</span>
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
        {viewingQuoteDetail ? (
           // Full Page Detail View
           renderQuoteDetailView()
        ) : (
           // Standard Dashboard Views
           <>
              {activeTab !== 'my-requests' && (
              <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
                    {activeTab === 'leads' ? 'Opportunità per te' : 
                     activeTab === 'quotes' ? 'Preventivi Inviati' :
                     activeTab === 'won' ? 'I tuoi Successi' :
                     activeTab === 'settings' ? `${user.brandName || user.name}` :
                     activeTab === 'billing' ? 'Crediti' : 'Dashboard'}
                  </h1>
                  <p className="text-slate-400 font-medium text-lg">
                      {activeTab === 'leads' ? 'Bentornato Pro. Fai crescere il tuo business.' :
                       activeTab === 'quotes' ? 'Monitora le tue proposte attive.' :
                       activeTab === 'won' ? 'Ottimo lavoro! Ecco i tuoi successi.' :
                       activeTab === 'settings' ? 'Professionista Verificato' :
                       isLoadingData ? 'Sincronizzazione...' : 'Dati aggiornati.'}
                  </p>
                </div>

                {/* Credit Widget for Pros in Opportunity Tab and other Pro tabs */}
                {isPro && (activeTab === 'leads' || activeTab === 'quotes' || activeTab === 'won') && (
                   <div className="bg-white px-6 py-3 rounded-[24px] border border-slate-100 shadow-sm flex items-center space-x-4 min-w-[200px]">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
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
                        {/* Search Bar */}
                        <div className="flex justify-end mb-4">
                           <div className="relative w-full max-w-sm">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="text" 
                                placeholder="Cerca opportunità..." 
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                              />
                           </div>
                        </div>

                        {matchedLeads.map(({ job, matchScore }) => (
                          <div key={job.id} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-indigo-100 transition-all shadow-sm flex flex-col md:flex-row gap-6 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Icon */}
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                               {getCategoryIcon(job.category)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-grow">
                               <div className="flex items-center gap-3 mb-1">
                                  <h3 className="text-lg font-black text-slate-900">{job.category}</h3>
                                  <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                                     <TrendingUp size={10} /> {matchScore}% MATCH
                                  </span>
                               </div>
                               
                               <p className="text-slate-600 text-sm mb-4 line-clamp-2 font-medium leading-relaxed">
                                  {job.description}
                               </p>
                               
                               <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <div className="flex items-center gap-1.5">
                                     <MapPin size={12} /> <span>{job.location?.city || 'Remoto'}</span>
                                  </div>
                                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                  <div className="flex items-center gap-1.5">
                                     <Wallet size={12} /> <span>Budget: {job.budget}</span>
                                  </div>
                                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                  <div className="flex items-center gap-1.5">
                                     <Clock size={12} /> <span>Pubblicato: {new Date(job.createdAt).toLocaleDateString()}</span>
                                  </div>
                               </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0 justify-end md:justify-center">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setViewingJobDetails(job); }}
                                 className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all text-sm flex items-center justify-center gap-2"
                               >
                                  <Eye size={16} /> Dettagli
                               </button>
                               <button 
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setQuoteMessage('');
                                    setQuotePrice('');
                                    setQuoteTimeline('');
                                    setQuoteTouched({ price: false, message: false, timeline: false });
                                    setShowQuoteModal(job);
                                 }}
                                 className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-sm flex items-center justify-center gap-2"
                               >
                                  Invia Proposta <Send size={16} />
                               </button>
                            </div>
                          </div>
                        ))}
                        {matchedLeads.length === 0 && <div className="text-center py-10 text-slate-400">Nessuna opportunità al momento.</div>}
                    </div>
                ) : activeTab === 'my-requests' ? (
                    // My Requests logic handled in sub-render function previously, moved here for clarity
                    <div className="space-y-8 animate-in fade-in">
                       <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-8">
                          <div>
                             <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">Le Mie Richieste</h1>
                             <p className="text-slate-400 font-medium text-lg">Monitora le tue richieste di preventivo.</p>
                          </div>
                          <div className="bg-white px-6 py-3 rounded-[24px] border border-slate-100 shadow-sm flex items-center space-x-4 min-w-[200px]">
                             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                                <TrendingUp size={20} />
                             </div>
                             <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progetti Attivi</div>
                                <div className="text-xl font-black text-slate-900 leading-none mt-1">{myJobs.filter(j => j.status === 'OPEN' || j.status === 'IN_PROGRESS').length}</div>
                             </div>
                          </div>
                       </header>

                       <button 
                          onClick={() => { resetJobForm(); setShowNewJobModal(true); }}
                          className="w-full md:w-auto px-6 py-4 bg-indigo-600 text-white font-bold rounded-[20px] hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center ml-auto"
                        >
                          <Plus className="mr-2" size={20} /> Chiedi un preventivo
                        </button>

                       {/* No Responses Banner - Check if any open job has 0 quotes */}
                       {myJobs.some(job => {
                          const quoteCount = clientQuotes.filter(q => q.jobId === job.id).length;
                          return job.status === 'OPEN' && quoteCount === 0;
                       }) && (
                          <div className="bg-amber-50 border border-amber-100 rounded-[24px] p-6 flex items-start gap-4">
                             <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shrink-0"><AlertTriangle size={20} /></div>
                             <div className="flex-grow pr-8">
                                <h4 className="font-bold text-slate-900 text-sm mb-1">Richieste senza risposte</h4>
                                <p className="text-slate-600 text-xs font-medium">Alcuni tuoi progetti non hanno ancora ricevuto preventivi. Prova a migliorare la descrizione con l'AI!</p>
                             </div>
                             <button className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                          </div>
                       )}

                       <div className="grid gap-6">
                          {myJobs.length === 0 ? (
                             <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-200">
                                 <h3 className="text-lg font-bold text-slate-900 mb-1">Nessuna richiesta attiva</h3>
                                 <button onClick={() => { resetJobForm(); setShowNewJobModal(true); }} className="text-indigo-600 font-bold hover:underline">Crea Richiesta</button>
                             </div>
                          ) : (
                             myJobs.map(job => {
                                const quotesForThisJob = clientQuotes.filter(q => q.jobId === job.id);
                                const quoteCount = quotesForThisJob.length;
                                const acceptedQuote = quotesForThisJob.find(q => q.status === 'ACCEPTED');
                                
                                return (
                                 <div key={job.id} className={`bg-white p-6 rounded-[24px] border transition-all shadow-sm flex flex-col md:flex-row items-start gap-6 ${acceptedQuote ? 'border-emerald-200' : 'border-slate-100 hover:border-indigo-100'}`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${acceptedQuote ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                       {getCategoryIcon(job.category)}
                                    </div>
                                    
                                    <div className="flex-grow w-full">
                                       <div className="flex flex-wrap items-center gap-3 mb-2">
                                          <h3 className="text-lg font-black text-slate-900">{job.category}</h3>
                                          {acceptedQuote ? (
                                             <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                Preventivo Accettato
                                             </span>
                                          ) : (
                                             <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                Aperta
                                             </span>
                                          )}
                                          {quoteCount > 0 && !acceptedQuote && (
                                             <span className="bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                Nuove Risposte
                                             </span>
                                          )}
                                       </div>
                                       
                                       <p className="text-slate-500 text-sm line-clamp-1 max-w-2xl mb-4 font-medium leading-relaxed">{job.description}</p>
                                       
                                       <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                          <div className="flex items-center gap-1.5"><Clock size={12} /><span>Pubblicata {new Date(job.createdAt).toLocaleDateString()}</span></div>
                                          <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                          <div className="flex items-center gap-1.5">
                                             <MessageSquare size={12} className={quoteCount > 0 ? 'text-indigo-500' : ''} />
                                             <span className={quoteCount > 0 ? 'text-indigo-600' : ''}>{quoteCount} Preventivi</span>
                                          </div>
                                       </div>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                                       {acceptedQuote ? (
                                          <button 
                                             onClick={() => setViewingJobQuotes(job)}
                                             className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all text-sm flex items-center justify-center gap-2"
                                          >
                                             Gestisci Progetto <ChevronRight size={16} />
                                          </button>
                                       ) : (
                                          <button 
                                             onClick={() => setViewingJobQuotes(job)}
                                             className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-sm flex items-center justify-center gap-2"
                                          >
                                             Gestisci Progetto <ChevronRight size={16} />
                                          </button>
                                       )}
                                       
                                       <div className="flex gap-2">
                                          <button 
                                             onClick={() => handleEditJob(job)}
                                             className="flex-1 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-100 font-bold rounded-xl hover:bg-slate-100 transition-all text-xs flex items-center justify-center gap-1.5"
                                          >
                                             <Edit3 size={12} /> Modifica
                                          </button>
                                          
                                          {quoteCount === 0 ? (
                                             <button 
                                                onClick={() => handleDeleteJob(job.id)}
                                                className="flex-1 px-4 py-2 bg-slate-50 text-slate-400 border border-slate-100 font-bold rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-xs flex items-center justify-center gap-1.5"
                                             >
                                                <Trash2 size={12} /> Elimina
                                             </button>
                                          ) : (
                                             <button 
                                                onClick={() => handleCloseJob(job.id)}
                                                className="flex-1 px-4 py-2 bg-slate-50 text-slate-400 border border-slate-100 font-bold rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-all text-xs flex items-center justify-center gap-1.5"
                                             >
                                                <XCircle size={12} /> Chiudi Richiesta
                                             </button>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                                );
                             })
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
           </>
        )}
      </main>

      {/* --- MODALS (Overlays) --- */}

      {/* New Job Modal (Client) */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowNewJobModal(false)}></div>
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
               <h3 className="text-xl font-black text-slate-900">
                  {modalStep === 'category' ? 'Nuova Richiesta' : selectedCategory}
               </h3>
               <button onClick={() => setShowNewJobModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X size={24} />
               </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-8">
               {modalStep === 'category' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {availableCategories.map(cat => (
                        <button 
                           key={cat} 
                           onClick={() => handleCategorySelect(cat)}
                           className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 text-left transition-all group"
                        >
                           <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
                              {getCategoryIcon(cat)}
                           </div>
                           <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-700">{cat}</div>
                        </button>
                     ))}
                  </div>
               ) : (
                  <>
                    {formDefinition && (
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
                    
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1">Budget Stimato</label>
                       <div className="grid grid-cols-2 gap-3">
                          {formDefinition?.budgetOptions.map(b => (
                             <button
                                key={b}
                                onClick={() => setBudget(b)}
                                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${budget === b ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                             >
                                {b}
                             </button>
                          ))}
                       </div>
                    </div>

                    {formDefinition?.askLocation && (
                       <div className="space-y-4">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1">Città (Opzionale)</label>
                          <input 
                             type="text" 
                             value={locationCity}
                             onChange={e => setLocationCity(e.target.value)}
                             placeholder="es. Milano, Remoto..."
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-600"
                          />
                       </div>
                    )}
                  </>
               )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[32px] flex justify-between items-center sticky bottom-0">
               {modalStep === 'details' ? (
                  <>
                     <button onClick={() => setModalStep('category')} className="text-slate-500 font-bold text-sm hover:text-slate-800">Indietro</button>
                     <button 
                        onClick={handleCreateJob}
                        disabled={creatingJob || !jobDescription || !budget}
                        className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center"
                     >
                        {creatingJob ? 'Pubblicazione...' : (editingJobId ? 'Salva Modifiche' : 'Pubblica Richiesta')}
                     </button>
                  </>
               ) : (
                  <div className="w-full text-center text-xs text-slate-400 font-medium">Seleziona una categoria per continuare</div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Quote Modal (Pro) */}
      {showQuoteModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowQuoteModal(null)}></div>
            <div className="bg-white rounded-[32px] w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
               <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 mb-1">Invia Preventivo</h3>
                        <p className="text-slate-500 text-sm font-medium">Per: {showQuoteModal.category}</p>
                     </div>
                     <button onClick={() => setShowQuoteModal(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">La tua Offerta (€)</label>
                        <div className="relative">
                           <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                           <input 
                              type="number" 
                              value={quotePrice}
                              onChange={e => setQuotePrice(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xl text-slate-900 focus:border-indigo-600 outline-none"
                              placeholder="0.00"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Tempistiche</label>
                        <div className="relative">
                           <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                           <input 
                              type="text" 
                              value={quoteTimeline}
                              onChange={e => setQuoteTimeline(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none"
                              placeholder="es. 2 settimane"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Messaggio</label>
                        <textarea 
                           value={quoteMessage}
                           onChange={e => setQuoteMessage(e.target.value)}
                           rows={4}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:border-indigo-600 outline-none resize-none"
                           placeholder="Descrivi brevemente la tua proposta..."
                        />
                     </div>
                  </div>

                  <button 
                     onClick={handleSendQuote}
                     className="w-full mt-8 py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                     <Send size={20} />
                     <span>Invia Preventivo</span>
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Job Details Modal (Pro) */}
      {viewingJobDetails && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingJobDetails(null)}></div>
            <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[85vh] overflow-y-auto relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
               <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                           {getCategoryIcon(viewingJobDetails.category)}
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900">{viewingJobDetails.category}</h3>
                           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {viewingJobDetails.location?.city || 'Remoto'} • {viewingJobDetails.budget}
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setViewingJobDetails(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="font-black text-slate-900 mb-2 text-sm uppercase tracking-wide">Descrizione</h4>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{viewingJobDetails.description}</p>
                     </div>

                     {viewingJobDetails.details && Object.keys(viewingJobDetails.details).length > 0 && (
                        <div>
                           <h4 className="font-black text-slate-900 mb-3 text-sm uppercase tracking-wide">Dettagli Tecnici</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {Object.entries(viewingJobDetails.details).map(([key, val]) => (
                                 <div key={key} className="p-3 border border-slate-200 rounded-xl bg-white">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{key}</div>
                                    <div className="font-medium text-slate-800 text-sm">{Array.isArray(val) ? val.join(', ') : val}</div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                     
                     <div className="flex justify-end pt-4">
                        <button 
                           onClick={() => { setViewingJobDetails(null); setShowQuoteModal(viewingJobDetails); }}
                           className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                        >
                           <Send size={18} /> Rispondi
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Client: View Quotes Modal */}
      {viewingJobQuotes && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingJobQuotes(null)}></div>
            <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                  <div>
                     <h3 className="text-xl font-black text-slate-900">Preventivi Ricevuti</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{viewingJobQuotes.category}</p>
                  </div>
                  <button onClick={() => setViewingJobQuotes(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                     <X size={24} />
                  </button>
               </div>
               
               <div className="p-6 overflow-y-auto bg-slate-50 flex-grow">
                  {currentJobQuotes.length === 0 ? (
                     <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Clock size={32} />
                        </div>
                        <h4 className="font-bold text-slate-900">In attesa di risposte</h4>
                        <p className="text-slate-500 text-sm mt-1">I professionisti stanno analizzando la tua richiesta.</p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {currentJobQuotes.map(quote => (
                           <div key={quote.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <div className="font-black text-lg text-slate-900">{quote.proName}</div>
                                    <div className="text-xs font-bold text-slate-400">{new Date(quote.createdAt).toLocaleDateString()}</div>
                                 </div>
                                 <div className="text-right">
                                    <div className="font-black text-2xl text-indigo-600">{quote.price} €</div>
                                    <div className="text-xs font-bold text-slate-500">{quote.timeline}</div>
                                 </div>
                              </div>
                              
                              <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 italic border border-slate-100 mb-6">
                                 "{quote.message}"
                              </div>

                              <div className="flex justify-end gap-3">
                                 <button 
                                    onClick={() => handleOpenQuoteDetail(quote)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-xs flex items-center gap-2"
                                 >
                                    <Eye size={14} /> Dettagli Completi
                                 </button>
                                 
                                 {quote.status === 'ACCEPTED' ? (
                                    <span className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-2">
                                       <Check size={14} /> Accettato
                                    </span>
                                 ) : quote.status === 'PENDING' && (
                                    <button 
                                       onClick={() => handleAcceptQuote(quote)}
                                       className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 text-xs flex items-center gap-2"
                                    >
                                       Accetta Preventivo <ArrowRight size={14} />
                                    </button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;
