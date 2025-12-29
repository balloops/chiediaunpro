
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, JobRequest, Quote, ServiceCategory, FormDefinition } from '../types';
import { 
  FileText, Send, Settings, Plus, Search, Clock, TrendingUp, Code, Palette, Camera, Video, BarChart3, ShoppingCart, AppWindow, ArrowLeft, MapPin, CreditCard as BillingIcon, Check, Eye, X, Phone, Download, Save, Lock, Edit3, Trash2, XCircle, AlertTriangle, Coins, Box, Wallet, Euro, Trophy, Star, ChevronRight, ArrowRight
} from 'lucide-react';
import { Link, useNavigate, useLocation, Routes, Route, useParams, useSearchParams } from 'react-router-dom';
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

// --- SUB COMPONENTS (PAGES) ---

// 1. Job Detail Page (Full Screen)
const JobDetailView: React.FC<{ user: User, isPro: boolean, refreshParent: () => void }> = ({ user, isPro, refreshParent }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<JobRequest | null>(null);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Pro Quote Form State
    const [quotePrice, setQuotePrice] = useState('');
    const [quoteMessage, setQuoteMessage] = useState('');
    const [quoteTimeline, setQuoteTimeline] = useState('');

    useEffect(() => {
        const fetchJob = async () => {
            if (!id) return;
            const jobs = await jobService.getJobs();
            const foundJob = jobs.find(j => j.id === id);
            if (foundJob) {
                setJob(foundJob);
                const qs = await jobService.getQuotesForJob(foundJob.id);
                setQuotes(qs);
            }
            setLoading(false);
        };
        fetchJob();
    }, [id]);

    const handleSendQuote = async () => {
        if (!job || !quotePrice || !quoteMessage || !quoteTimeline) return;
        try {
            await jobService.sendQuote({
                jobId: job.id,
                proId: user.id,
                proName: user.brandName || user.name,
                price: parseFloat(quotePrice),
                message: quoteMessage,
                timeline: quoteTimeline,
                clientOwnerId: job.clientId,
                category: job.category
            });
            await notificationService.notifyNewQuote(job.clientId, user.brandName || user.name, job.category, job.id);
            alert("Preventivo inviato!");
            navigate('/dashboard'); // Back to list
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleAcceptQuote = async (quote: Quote) => {
        if (window.confirm("Confermi di voler accettare questo preventivo?")) {
            try {
                await jobService.updateQuoteStatus(quote, 'ACCEPTED');
                await notificationService.notifyQuoteAccepted(quote.proId, user.name, quote.id);
                // Navigate to the quote detail to see contact info immediately
                navigate(`/dashboard/quote/${quote.id}`);
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (loading) return <div className="p-10 text-center">Caricamento...</div>;
    if (!job) return <div className="p-10 text-center">Richiesta non trovata.</div>;

    const myQuote = isPro ? quotes.find(q => q.proId === user.id) : null;

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300 max-w-5xl mx-auto">
            <button onClick={() => navigate('/dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold text-sm">
                <ArrowLeft size={18} className="mr-2" /> Torna alla lista
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Job Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 mb-2">{job.category}</h1>
                                <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                                    <span className="flex items-center"><MapPin size={16} className="mr-1"/> {job.location?.city || 'Remoto'}</span>
                                    <span className="flex items-center"><Wallet size={16} className="mr-1"/> {job.budget}</span>
                                    <span className="flex items-center"><Clock size={16} className="mr-1"/> {new Date(job.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                {job.status === 'OPEN' ? 'Aperta' : job.status}
                            </span>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase">Descrizione</h3>
                                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                            </div>
                            {job.details && (
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase">Dettagli Tecnici</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Object.entries(job.details).map(([k, v]) => (
                                            <div key={k} className="p-3 border border-slate-200 rounded-xl bg-white">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{k}</div>
                                                <div className="font-medium text-slate-800 text-sm">{Array.isArray(v) ? v.join(', ') : v}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CLIENT VIEW: List Quotes */}
                    {!isPro && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black text-slate-900">Preventivi Ricevuti ({quotes.length})</h2>
                            {quotes.length === 0 ? (
                                <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
                                    Nessun preventivo ancora ricevuto.
                                </div>
                            ) : (
                                quotes.map(q => (
                                    <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div>
                                            <div className="font-black text-lg text-slate-900">{q.proName}</div>
                                            <div className="text-2xl font-black text-indigo-600 my-1">{q.price} €</div>
                                            <div className="text-sm text-slate-500 font-medium">{q.timeline}</div>
                                            <div className="mt-3 p-3 bg-slate-50 rounded-xl text-sm italic text-slate-600">"{q.message}"</div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button 
                                                onClick={() => navigate(`/dashboard/quote/${q.id}`)}
                                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 text-sm"
                                            >
                                                Dettagli
                                            </button>
                                            {q.status === 'PENDING' && (
                                                <button 
                                                    onClick={() => handleAcceptQuote(q)}
                                                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 text-sm shadow-lg shadow-indigo-100"
                                                >
                                                    Accetta
                                                </button>
                                            )}
                                            {q.status === 'ACCEPTED' && (
                                                <span className="px-5 py-2.5 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-sm flex items-center">
                                                    <Check size={16} className="mr-2" /> Accettato
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Action / Quote Form */}
                <div className="lg:col-span-1">
                    {isPro ? (
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl sticky top-24">
                            {myQuote ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check size={32} />
                                    </div>
                                    <h3 className="font-black text-xl text-slate-900">Preventivo Inviato</h3>
                                    <p className="text-slate-500 text-sm mt-2 mb-6">Hai già risposto a questa richiesta.</p>
                                    <button onClick={() => navigate(`/dashboard/quote/${myQuote.id}`)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">
                                        Vedi il tuo preventivo
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <h3 className="font-black text-xl text-slate-900">Invia Preventivo</h3>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">Prezzo (€)</label>
                                        <input type="number" value={quotePrice} onChange={e=>setQuotePrice(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">Tempistiche</label>
                                        <input type="text" value={quoteTimeline} onChange={e=>setQuoteTimeline(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Es. 2 settimane" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">Messaggio</label>
                                        <textarea value={quoteMessage} onChange={e=>setQuoteMessage(e.target.value)} rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Descrivi la tua offerta..." />
                                    </div>
                                    <button onClick={handleSendQuote} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all">
                                        Invia Offerta
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Client Side Panel Info
                        <div className="bg-indigo-50 p-6 rounded-[32px] sticky top-24">
                            <h3 className="font-bold text-indigo-900 mb-2">Consiglio</h3>
                            <p className="text-sm text-indigo-700/80 mb-4">Riceverai una notifica per ogni nuovo preventivo. Controlla spesso questa pagina.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 2. Quote Detail Page
const QuoteDetailView: React.FC<{ user: User, isPro: boolean }> = ({ user, isPro }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quote, setQuote] = useState<Quote | null>(null);
    const [job, setJob] = useState<JobRequest | null>(null);
    const [contact, setContact] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            const quotes = await jobService.getQuotes();
            const q = quotes.find(qt => qt.id === id);
            if (q) {
                setQuote(q);
                const jobs = await jobService.getJobs();
                const j = jobs.find(jb => jb.id === q.jobId);
                setJob(j || null);
                
                if (q.status === 'ACCEPTED') {
                    const targetId = isPro ? j?.clientId : q.proId;
                    if (targetId) {
                        const profile = await jobService.getUserProfile(targetId);
                        setContact(profile);
                    }
                }
            }
            setLoading(false);
        };
        load();
    }, [id, isPro]);

    const handleAccept = async () => {
        if (!quote || !job) return;
        if(window.confirm("Sei sicuro di voler accettare questo preventivo e sbloccare i contatti?")) {
            await jobService.updateQuoteStatus(quote, 'ACCEPTED');
            await notificationService.notifyQuoteAccepted(quote.proId, user.name, quote.id);
            // Reload to fetch contact info
            window.location.reload();
        }
    };

    if (loading) return <div className="p-10 text-center">Caricamento...</div>;
    if (!quote || !job) return <div className="p-10 text-center">Preventivo non trovato.</div>;

    const isAccepted = quote.status === 'ACCEPTED';

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300 max-w-4xl mx-auto">
             <button onClick={() => navigate(isPro ? '/dashboard' : `/dashboard/job/${job.id}`)} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold text-sm">
                <ArrowLeft size={18} className="mr-2" /> Torna indietro
            </button>

            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-xl">
                <div className={`p-8 text-white ${isAccepted ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2">Preventivo per {job.category}</div>
                            <h1 className="text-3xl font-black">{quote.price} €</h1>
                            <div className="text-white/80 font-medium mt-1">Tempistiche: {quote.timeline}</div>
                        </div>
                        {isAccepted && (
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                <Check size={32} className="text-white" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Message */}
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Messaggio del Professionista</h3>
                        <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 italic border border-slate-100 text-lg leading-relaxed">
                            "{quote.message}"
                        </div>
                    </div>

                    {/* Contact Info Section */}
                    <div className={`p-8 rounded-[24px] border-2 transition-all ${isAccepted ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                        <div className="flex items-center space-x-4 mb-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAccepted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                {isAccepted ? <Phone size={24} /> : <Lock size={24} />}
                            </div>
                            <div>
                                <h3 className={`font-black text-lg ${isAccepted ? 'text-emerald-900' : 'text-slate-500'}`}>
                                    {isAccepted ? 'Contatti Sbloccati' : 'Contatti Nascosti'}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {isAccepted ? 'Puoi contattare direttamente la controparte.' : 'Accetta il preventivo per vedere email e telefono.'}
                                </p>
                            </div>
                        </div>

                        {isAccepted && contact ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                                <div>
                                    <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Nome</label>
                                    <div className="font-bold text-slate-900 text-lg">{contact.brandName || contact.name}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Email</label>
                                    <div className="font-bold text-slate-900">{contact.email}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Telefono</label>
                                    <div className="font-bold text-slate-900">{contact.phoneNumber || 'Non specificato'}</div>
                                </div>
                            </div>
                        ) : !isPro && !isAccepted && (
                            <button 
                                onClick={handleAccept}
                                className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                            >
                                Accetta Preventivo e Vedi Contatti <ArrowRight size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD LAYOUT & LISTS ---

const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [user, setUser] = useState<User>(initialUser);
  const isPro = user.role === UserRole.PROFESSIONAL;
  
  // URL Driven State (Source of Truth)
  const currentTab = searchParams.get('tab') || (isPro ? 'leads' : 'my-requests');

  // Data State
  const [matchedLeads, setMatchedLeads] = useState<{ job: JobRequest; matchScore: number }[]>([]);
  const [myJobs, setMyJobs] = useState<JobRequest[]>([]);
  const [sentQuotes, setSentQuotes] = useState<Quote[]>([]);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Realtime New Lead Notification
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  // New Job Modal State
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [modalStep, setModalStep] = useState<'category' | 'details' | 'budget'>('category');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobDetails, setJobDetails] = useState<Record<string, any>>({});
  const [budget, setBudget] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [creatingJob, setCreatingJob] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<User>(user);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- DATA FETCHING ---

  const refreshData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingData(true);
    try {
        const latestUser = await authService.getCurrentUser();
        if (latestUser) {
            setUser(latestUser);
            setProfileForm(latestUser);
        }
        setAvailableCategories(contentService.getCategories());

        if (latestUser?.role === UserRole.PROFESSIONAL) {
            const matches = await jobService.getMatchesForPro(latestUser);
            setMatchedLeads(matches);
            const allQuotes = await jobService.getQuotes();
            setSentQuotes(allQuotes.filter(q => q.proId === latestUser.id));
        } else if (latestUser) {
            const allJobs = await jobService.getJobs();
            const myJobsFiltered = allJobs.filter(j => j.clientId === latestUser.id);
            setMyJobs(myJobsFiltered);
            const allQuotes = await jobService.getQuotes();
            const myJobIds = new Set(myJobsFiltered.map(j => j.id));
            setClientQuotes(allQuotes.filter(q => myJobIds.has(q.jobId)));
        }
    } catch (e) { console.error(e); } 
    finally { if (showLoading) setIsLoadingData(false); }
  }, []);

  useEffect(() => {
    refreshData(true);
  }, [currentTab, refreshData]);

  // --- REALTIME ---
  useEffect(() => {
    const channel = supabase
      .channel('dashboard_realtime_v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        async (payload) => {
           // If Pro, refresh matches silently
           if (isPro) {
               console.log("New Job Detected! Refreshing leads...");
               await refreshData(false); 
               // Visual cue
               setNewLeadsCount(prev => prev + 1);
               setTimeout(() => setNewLeadsCount(0), 5000); // Clear badge after 5s
           }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes' },
        () => refreshData(false)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshData, isPro]);


  // --- HANDLERS (New Job Modal) ---
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setFormDefinition(contentService.getFormDefinition(category));
    setModalStep('details');
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
        setJobDescription('');
        setBudget('');
        await refreshData();
    } catch (e: any) { alert(e.message); } 
    finally { setCreatingJob(false); }
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

  const handleSaveProfile = async () => {
     setIsSavingProfile(true);
     try {
        await jobService.updateUserProfile(user.id, {
           name: profileForm.name,
           brandName: profileForm.brandName,
           location: profileForm.location,
        });
        await refreshData();
        alert("Profilo aggiornato!");
     } catch(e) { console.error(e); } 
     finally { setIsSavingProfile(false); }
  };

  const handleUpgrade = async (plan: any) => {
    await jobService.updateUserPlan(user.id, plan);
    refreshData();
    alert(`Piano ${plan} attivato!`);
  };

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

  // --- RENDER CONTENT (LISTS) ---
  const renderDashboardContent = () => (
      <>
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
                {currentTab === 'leads' ? 'Opportunità per te' : 
                    currentTab === 'quotes' ? 'Preventivi Inviati' :
                    currentTab === 'won' ? 'I tuoi Successi' :
                    currentTab === 'settings' ? `${user.brandName || user.name}` :
                    currentTab === 'billing' ? 'Crediti' : 'Dashboard'}
                </h1>
                <p className="text-slate-400 font-medium text-lg">
                    {newLeadsCount > 0 ? `🔥 ${newLeadsCount} Nuove opportunità appena arrivate!` : 'Bentornato nella tua dashboard.'}
                </p>
            </div>
            {isPro && (currentTab === 'leads' || currentTab === 'quotes' || currentTab === 'won') && (
                <div className="bg-white px-6 py-3 rounded-[24px] border border-slate-100 shadow-sm flex items-center space-x-4 min-w-[200px]">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center"><Coins size={20} /></div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crediti</div>
                        <div className="text-xl font-black text-slate-900 leading-none mt-1">{user.credits}</div>
                    </div>
                </div>
            )}
        </header>

        {/* Loading */}
        {isLoadingData && matchedLeads.length === 0 && myJobs.length === 0 && (
            <div className="py-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div></div>
        )}

        {/* Tab Content */}
        {!isLoadingData && (
            <>
                {currentTab === 'leads' && (
                    <div className="space-y-6">
                        {matchedLeads.map(({ job, matchScore }) => (
                            <div key={job.id} onClick={() => navigate(`/dashboard/job/${job.id}`)} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col md:flex-row gap-6 items-start animate-in fade-in slide-in-from-top-2">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    {getCategoryIcon(job.category)}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{job.category}</h3>
                                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                            <TrendingUp size={10} /> {matchScore}% MATCH
                                        </span>
                                        {/* New Badge if very recent */}
                                        {new Date(job.createdAt).getTime() > Date.now() - 60000 && (
                                            <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase animate-pulse">NUOVO</span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-sm mb-4 line-clamp-2 font-medium">{job.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span className="flex items-center gap-1"><MapPin size={12}/> {job.location?.city || 'Remoto'}</span>
                                        <span className="flex items-center gap-1"><Wallet size={12}/> {job.budget}</span>
                                        <span className="flex items-center gap-1"><Clock size={12}/> {new Date(job.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="self-center">
                                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {matchedLeads.length === 0 && <div className="text-center py-10 text-slate-400">Nessuna opportunità al momento.</div>}
                    </div>
                )}

                {currentTab === 'my-requests' && (
                    <div className="space-y-6">
                         <div className="flex justify-end mb-6">
                            <button 
                                onClick={() => { setModalStep('category'); setShowNewJobModal(true); }}
                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center"
                            >
                                <Plus className="mr-2" size={20} /> Nuova Richiesta
                            </button>
                         </div>
                         {myJobs.map(job => {
                             const quoteCount = clientQuotes.filter(q => q.jobId === job.id).length;
                             return (
                                <div key={job.id} onClick={() => navigate(`/dashboard/job/${job.id}`)} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-indigo-600 cursor-pointer transition-all flex flex-col md:flex-row gap-6">
                                     <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                                        {getCategoryIcon(job.category)}
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-black text-slate-900">{job.category}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-1 mb-2">{job.description}</p>
                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                            <span className={`px-2 py-0.5 rounded uppercase ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{job.status}</span>
                                            <span>{quoteCount} Preventivi</span>
                                        </div>
                                    </div>
                                </div>
                             );
                         })}
                    </div>
                )}

                {(currentTab === 'quotes' || currentTab === 'won') && (
                    <div className="space-y-6">
                         {sentQuotes.filter(q => currentTab === 'won' ? q.status === 'ACCEPTED' : true).map(quote => (
                             <div key={quote.id} onClick={() => navigate(`/dashboard/quote/${quote.id}`)} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-indigo-600 cursor-pointer transition-all">
                                 <div className="flex justify-between items-center mb-2">
                                     <div className="font-black text-lg text-slate-900">{quote.price} €</div>
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${quote.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{quote.status}</span>
                                 </div>
                                 <p className="text-sm text-slate-500 italic">"{quote.message}"</p>
                             </div>
                         ))}
                    </div>
                )}

                {currentTab === 'settings' && (
                     <div className="bg-white p-8 rounded-[24px] border border-slate-100 max-w-2xl">
                          <h2 className="text-xl font-black text-slate-900 mb-6">Profilo</h2>
                          <div className="space-y-4">
                              <div>
                                  <label className="text-xs font-black text-slate-400 uppercase">Nome</label>
                                  <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                              </div>
                              {isPro && (
                                  <div>
                                      <label className="text-xs font-black text-slate-400 uppercase">Brand</label>
                                      <input type="text" value={profileForm.brandName || ''} onChange={e => setProfileForm({...profileForm, brandName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                                  </div>
                              )}
                              <div>
                                  <label className="text-xs font-black text-slate-400 uppercase">Località</label>
                                  <input type="text" value={profileForm.location || ''} onChange={e => setProfileForm({...profileForm, location: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                              </div>
                              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
                                  {isSavingProfile ? 'Salvataggio...' : 'Salva Modifiche'}
                              </button>
                          </div>
                     </div>
                )}

                {currentTab === 'billing' && (
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20 max-w-2xl">
                        <div className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-2">Bilancio Crediti</div>
                        <div className="text-7xl font-black mb-2 tracking-tighter">{user.credits && user.credits >= 999 ? '∞' : (user.credits ?? 0)}</div>
                        <button onClick={() => handleUpgrade('PRO')} className="mt-4 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold">Ricarica Crediti</button>
                    </div>
                )}
            </>
        )}
      </>
  );

  return (
    <div className="bg-slate-50 min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-20 lg:w-80 border-r border-slate-100 bg-white flex flex-col p-6 sticky top-[73px] h-[calc(100vh-73px)] z-20 shrink-0">
             <div className="space-y-2 flex-grow">
                {[
                    { id: 'leads', label: 'Opportunità', icon: <Star size={20} />, role: 'pro' },
                    { id: 'my-requests', label: 'Mie Richieste', icon: <FileText size={20} />, role: 'client' },
                    { id: 'quotes', label: 'Preventivi Inviati', icon: <Send size={20} />, role: 'pro' },
                    { id: 'won', label: 'Lavori Ottenuti', icon: <Trophy size={20} />, role: 'pro' },
                    { id: 'settings', label: 'Profilo', icon: <Settings size={20} />, role: 'all' },
                    { id: 'billing', label: 'Crediti', icon: <BillingIcon size={20} />, role: 'pro' }
                ]
                .filter(item => item.role === 'all' || (isPro && item.role === 'pro') || (!isPro && item.role === 'client'))
                .map((item) => (
                    <Link
                        key={item.id}
                        to={`/dashboard?tab=${item.id}`} // URL is the source of truth
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${currentTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600 font-medium'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="shrink-0">{item.icon}</div>
                            <span className="font-bold text-sm hidden lg:block whitespace-nowrap">{item.label}</span>
                        </div>
                    </Link>
                ))}
             </div>
        </aside>

        {/* Main Content Area - Routes */}
        <main className="flex-grow p-8 lg:p-12 overflow-x-hidden">
             <Routes>
                 <Route path="/" element={renderDashboardContent()} />
                 <Route path="/job/:id" element={<JobDetailView user={user} isPro={isPro} refreshParent={refreshData} />} />
                 <Route path="/quote/:id" element={<QuoteDetailView user={user} isPro={isPro} />} />
             </Routes>
        </main>

        {/* Create Job Modal (Only Modal left as it's a creation flow) */}
        {showNewJobModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowNewJobModal(false)}></div>
                <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col">
                     <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                         <h3 className="text-xl font-black text-slate-900">{modalStep === 'category' ? 'Nuova Richiesta' : selectedCategory}</h3>
                         <button onClick={() => setShowNewJobModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
                     </div>
                     <div className="p-6 md:p-8 space-y-8">
                         {modalStep === 'category' ? (
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                 {availableCategories.map(cat => (
                                     <button key={cat} onClick={() => handleCategorySelect(cat)} className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 text-left transition-all">
                                         <div className="font-bold text-slate-900 text-sm">{cat}</div>
                                     </button>
                                 ))}
                             </div>
                         ) : (
                             <>
                                {formDefinition && (
                                    <ServiceForm formDefinition={formDefinition} description={jobDescription} setDescription={setJobDescription} details={jobDetails} setDetails={setJobDetails} onRefine={handleRefineDescription} isRefining={isRefining} />
                                )}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <label className="text-xs font-black text-slate-500 uppercase">Budget</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {formDefinition?.budgetOptions.map(b => (
                                            <button key={b} onClick={() => setBudget(b)} className={`py-3 px-4 rounded-xl text-xs font-bold border ${budget === b ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200'}`}>{b}</button>
                                        ))}
                                    </div>
                                </div>
                                {formDefinition?.askLocation && (
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-500 uppercase">Città</label>
                                        <input type="text" value={locationCity} onChange={e => setLocationCity(e.target.value)} placeholder="Milano..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
                                    </div>
                                )}
                             </>
                         )}
                     </div>
                     <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[32px] flex justify-between items-center sticky bottom-0">
                         {modalStep === 'details' && (
                             <button onClick={handleCreateJob} disabled={creatingJob || !jobDescription || !budget} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center ml-auto">
                                 {creatingJob ? 'Pubblicazione...' : 'Pubblica Richiesta'}
                             </button>
                         )}
                     </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Dashboard;
