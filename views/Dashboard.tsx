
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, JobRequest, Quote, ServiceCategory, FormDefinition } from '../types';
import { 
  FileText, Send, Settings, Plus, Search, Clock, TrendingUp, Code, Palette, Camera, Video, BarChart3, ShoppingCart, AppWindow, ArrowLeft, MapPin, CreditCard as BillingIcon, Check, Eye, X, Phone, Download, Save, Lock, Edit3, Trash2, XCircle, AlertTriangle, Coins, Box, Wallet, Euro, Trophy, Star, ChevronRight, ArrowRight, User as UserIcon, RefreshCw, WifiOff, LogOut, Shield, HelpCircle, Briefcase
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
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || (isPro ? 'leads' : 'my-requests'); // Get current tab context

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
            // Redirect to Quotes tab explicitly
            navigate('/dashboard?tab=quotes');
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleAcceptQuote = async (quote: Quote) => {
        if (window.confirm("Confermi di voler accettare questo preventivo?")) {
            try {
                await jobService.updateQuoteStatus(quote, 'ACCEPTED');
                await notificationService.notifyQuoteAccepted(quote.proId, user.name, quote.id);
                // Navigate to the quote detail to see contact info immediately, preserving context is tricky here, defaulting to quote detail
                navigate(`/dashboard/quote/${quote.id}?tab=${activeTab}`);
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (loading) return <div className="p-10 text-center">Caricamento...</div>;
    if (!job) return <div className="p-10 text-center">Richiesta non trovata.</div>;

    const myQuote = isPro ? quotes.find(q => q.proId === user.id) : null;

    return (
        <div className="animate-fade-simple max-w-[1250px] mx-auto w-full">
            <button 
                onClick={() => navigate(`/dashboard?tab=${activeTab}`)} 
                className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold text-sm transition-colors"
            >
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
                                                onClick={() => navigate(`/dashboard/quote/${q.id}?tab=${activeTab}`)}
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
                                    <button onClick={() => navigate(`/dashboard/quote/${myQuote.id}?tab=${activeTab}`)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">
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
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || (isPro ? 'quotes' : 'my-requests'); // Default fallback based on role

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
        <div className="animate-fade-simple max-w-[1250px] mx-auto w-full">
             <button 
                // Back button goes to the specific tab
                onClick={() => navigate(`/dashboard?tab=${activeTab}`)} 
                className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold text-sm transition-colors"
            >
                <ArrowLeft size={18} className="mr-2" /> Torna indietro
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Original Job Details (Context) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{job.category}</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Richiesta Originale Cliente</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase">Descrizione Progetto</h3>
                                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                                <span className="flex items-center"><MapPin size={16} className="mr-1"/> {job.location?.city || 'Remoto'}</span>
                                <span className="flex items-center"><Wallet size={16} className="mr-1"/> Budget: {job.budget}</span>
                                <span className="flex items-center"><UserIcon size={16} className="mr-1"/> {job.clientName}</span>
                            </div>

                            {job.details && (
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase">Specifiche Tecniche</h3>
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
                </div>

                {/* Right Side: Quote Details & Status */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-xl sticky top-24">
                        <div className={`p-8 text-white ${isAccepted ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2">
                                        {isPro ? 'Il tuo preventivo' : 'Preventivo ricevuto'}
                                    </div>
                                    <h1 className="text-4xl font-black">{quote.price} €</h1>
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
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Messaggio</h3>
                                <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 italic border border-slate-100 text-base leading-relaxed">
                                    "{quote.message}"
                                </div>
                            </div>

                            {/* Contact Info Section */}
                            <div className={`p-6 rounded-[24px] border-2 transition-all ${isAccepted ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAccepted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                        {isAccepted ? <Phone size={20} /> : <Lock size={20} />}
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-base ${isAccepted ? 'text-emerald-900' : 'text-slate-500'}`}>
                                            {isAccepted ? 'Contatti Sbloccati' : 'Contatti Nascosti'}
                                        </h3>
                                    </div>
                                </div>

                                {isAccepted && contact ? (
                                    <div className="space-y-3 animate-in fade-in">
                                        <div>
                                            <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Nome</label>
                                            <div className="font-bold text-slate-900">{contact.brandName || contact.name}</div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Email</label>
                                            <div className="font-bold text-slate-900 break-all">{contact.email}</div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Telefono</label>
                                            <div className="font-bold text-slate-900">{contact.phoneNumber || 'Non specificato'}</div>
                                        </div>
                                    </div>
                                ) : !isPro && !isAccepted && (
                                    <button 
                                        onClick={handleAccept}
                                        className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        Accetta e Vedi Contatti <ArrowRight size={16} />
                                    </button>
                                )}
                                {isPro && !isAccepted && (
                                    <p className="text-xs text-slate-400">I contatti del cliente saranno visibili solo se accetta il tuo preventivo.</p>
                                )}
                            </div>
                        </div>
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
  const [searchParams] = useSearchParams();
  
  const [user, setUser] = useState<User>(initialUser);
  
  // Temporary state to allow role switching view without re-login
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);
  
  const activeRole = roleOverride || user.role;
  const isPro = activeRole === UserRole.PROFESSIONAL;
  
  // URL Driven State (Source of Truth)
  const currentTab = searchParams.get('tab') || (isPro ? 'leads' : 'my-requests');
  const currentTabRef = useRef(currentTab); // Ref to access current tab inside closure

  // Data State
  const [matchedLeads, setMatchedLeads] = useState<{ job: JobRequest; matchScore: number }[]>([]);
  const [myJobs, setMyJobs] = useState<JobRequest[]>([]);
  const [sentQuotes, setSentQuotes] = useState<Quote[]>([]);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
  const [viewedJobs, setViewedJobs] = useState<Set<string>>(new Set());
  
  // Cache to resolve job info for sent quotes
  const [allJobsCache, setAllJobsCache] = useState<JobRequest[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  
  // Realtime New Lead Notification
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [hasUnseenLeads, setHasUnseenLeads] = useState(false); // Sidebar notification state

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

  // Profile Hub State
  const [settingsView, setSettingsView] = useState<'menu' | 'profile_edit' | 'services'>('menu');
  const [profileForm, setProfileForm] = useState<User>(user);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // --- DATA FETCHING ---

  const refreshData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingData(true);
    setFetchError(false);
    
    // Increased timeout to 15 seconds to handle cold starts better
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
    );

    try {
        const fetchPromise = (async () => {
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
                const all = await jobService.getJobs();
                setAllJobsCache(all);
            } else if (latestUser) {
                const allJobs = await jobService.getJobs();
                const myJobsFiltered = allJobs.filter(j => j.clientId === latestUser.id);
                setMyJobs(myJobsFiltered);
                const allQuotes = await jobService.getQuotes();
                const myJobIds = new Set(myJobsFiltered.map(j => j.id));
                setClientQuotes(allQuotes.filter(q => myJobIds.has(q.jobId)));
            }
        })();

        await Promise.race([fetchPromise, timeoutPromise]);

    } catch (e) { 
        console.error("Dashboard fetch error:", e); 
        setFetchError(true);
    } 
    finally { 
        if (showLoading) setIsLoadingData(false); 
    }
  }, []);

  useEffect(() => {
    refreshData(true);
    currentTabRef.current = currentTab;
  }, [currentTab, refreshData]);

  // Load viewed jobs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('chiediunpro_viewed_jobs');
    if (stored) {
        try {
            setViewedJobs(new Set(JSON.parse(stored)));
        } catch (e) {
            console.error("Error loading viewed jobs", e);
        }
    }
  }, []);

  // Sync Unseen Leads State
  useEffect(() => {
      // Logic: If there are ANY matched leads that are NOT in viewedJobs, sidebar light is ON.
      if (isPro && matchedLeads.length > 0) {
          const hasUnread = matchedLeads.some(m => !viewedJobs.has(m.job.id));
          setHasUnseenLeads(hasUnread);
      } else {
          setHasUnseenLeads(false);
      }
  }, [matchedLeads, viewedJobs, isPro]);

  // --- REALTIME ---
  useEffect(() => {
    const channel = supabase
      .channel('dashboard_realtime_v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        async (payload) => {
           if (isPro) {
               console.log("New Job Detected! Refreshing leads...");
               await refreshData(false); 
               setNewLeadsCount(prev => prev + 1);
               setTimeout(() => setNewLeadsCount(0), 5000); 
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


  // --- HANDLERS ---
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
           phoneNumber: profileForm.phoneNumber,
           bio: profileForm.bio,
           offeredServices: profileForm.offeredServices
        });
        await refreshData();
        alert("Profilo aggiornato con successo!");
     } catch(e: any) { 
         console.error(e); 
         // Helper to explain the schema error to the user
         if (e.message?.includes('schema cache') || e.message?.includes('column')) {
            alert(`⚠️ ERRORE DATABASE CRITICO: La tabella 'profiles' non ha la colonna 'phone_number'. \n\nSOLUZIONE: Vai nella dashboard di Supabase -> SQL Editor ed esegui lo script SQL fornito (SQL_SETUP.sql).`);
         } else {
            alert(`Errore durante il salvataggio: ${e.message}`); 
         }
     } 
     finally { setIsSavingProfile(false); }
  };

  const