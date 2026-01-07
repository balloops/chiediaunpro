import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, JobRequest, Quote, ServiceCategory } from '../../types';
import { 
  FileText, Send, Settings, Plus, Star, Trophy, MapPin, Wallet, Clock, 
  ChevronRight, ArrowLeft, ArrowRight, Check, Phone, Lock, 
  Code, ShoppingCart, Palette, Camera, Video, BarChart3, AppWindow, Box, 
  Briefcase, HelpCircle, LogOut, Coins, RefreshCw, WifiOff,
  User as UserIcon, TrendingUp, Euro, Filter, ChevronDown, ArrowUp, ArrowDown,
  Trash2, Edit3, XCircle, Save, X, Ban, Archive, Zap, MessageSquare, Key
} from 'lucide-react';
import { Link, useNavigate, useLocation, Routes, Route, useParams, useSearchParams } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import { notificationService } from '../../services/notificationService';
import { authService } from '../../services/authService';
import { contentService } from '../../services/contentService';
import { supabase } from '../../services/supabaseClient';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

// --- SUB COMPONENTS (PAGES) ---

// 1. Job Detail Page (Full Screen)
const JobDetailView: React.FC<{ user: User, isPro: boolean, refreshParent: () => Promise<void> }> = ({ user, isPro, refreshParent }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || (isPro ? 'leads' : 'my-requests'); 

    const [job, setJob] = useState<JobRequest | null>(null);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [quotePrice, setQuotePrice] = useState('');
    const [quoteMessage, setQuoteMessage] = useState('');
    const [quoteTimeline, setQuoteTimeline] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ description: '', budget: '', city: '' });

    useEffect(() => {
        const fetchJob = async () => {
            if (!id) return;
            const jobs = await jobService.getJobs();
            const foundJob = jobs.find(j => j.id === id);
            if (foundJob) {
                setJob(foundJob);
                setEditData({
                    description: foundJob.description,
                    budget: foundJob.budget || '',
                    city: foundJob.location?.city || ''
                });
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
            navigate('/dashboard?tab=quotes');
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleAcceptQuote = async (quote: Quote) => {
        if (!job) return;
        if (window.confirm("Confermi di voler accettare questo preventivo?")) {
            try {
                await jobService.updateQuoteStatus(quote, 'ACCEPTED');
                await jobService.updateJobStatus(job.id, 'IN_PROGRESS');
                await notificationService.notifyQuoteAccepted(quote.proId, user.name, quote.id);
                navigate(`/dashboard/quote/${quote.id}?tab=${activeTab}`);
            } catch (e: any) {
                alert("Errore accettazione: " + (e.message));
            }
        }
    };

    const handleUpdateJob = async () => {
        if (!job) return;
        try {
            await jobService.updateJobDetails(job.id, {
                description: editData.description,
                budget: editData.budget,
                location: { city: editData.city }
            });
            setIsEditing(false);
            setJob(prev => prev ? ({ ...prev, description: editData.description, budget: editData.budget, location: { city: editData.city } }) : null);
            alert("Richiesta aggiornata!");
        } catch (e: any) {
            alert("Errore aggiornamento: " + e.message);
        }
    };

    const handleDeleteJob = async () => {
        if (!job) return;
        if (window.confirm("Sei sicuro di voler eliminare definitivamente questa richiesta?")) {
            try {
                await jobService.deleteJob(job.id);
                await refreshParent();
                navigate('/dashboard?tab=my-requests');
            } catch (e: any) {
                alert("Errore eliminazione: " + e.message);
            }
        }
    };

    const handleArchiveJob = async () => {
        if (!job) return;
        if (window.confirm("Archiviando la richiesta, non sarà più visibile ai nuovi professionisti nel marketplace. Confermi?")) {
            try {
                await jobService.updateJobStatus(job.id, 'ARCHIVED');
                await refreshParent();
                navigate('/dashboard?tab=archived');
            } catch (e: any) {
                alert("Errore archiviazione: " + e.message);
            }
        }
    };

    const handleCloseJob = async () => {
        if (!job) return;
        if (window.confirm("Chiudendo la richiesta non sarà più visibile ai professionisti. Confermi?")) {
            try {
                await jobService.updateJobStatus(job.id, 'CANCELLED');
                setJob(prev => prev ? ({ ...prev, status: 'CANCELLED' }) : null);
                await refreshParent();
            } catch (e: any) {
                alert("Errore chiusura: " + e.message);
            }
        }
    };

    if (loading) return <div className="p-10 text-center">Caricamento...</div>;
    if (!job) return <div className="p-10 text-center">Richiesta non trovata.</div>;

    const myQuote = isPro ? quotes.find(q => q.proId === user.id) : null;
    const hasQuotes = quotes.length > 0;
    const canEditOrDelete = !isPro && !hasQuotes && job.status === 'OPEN';
    const canClose = !isPro && hasQuotes && job.status === 'OPEN';
    const canArchive = !isPro && hasQuotes && job.status !== 'ARCHIVED';

    return (
        <div className="animate-fade-simple max-w-[1250px] mx-auto w-full pb-20">
            <button onClick={() => navigate(`/dashboard?tab=${activeTab}`)} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold text-sm transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Torna alla lista
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 mb-2">{job.category}</h1>
                                {!isEditing ? (
                                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                                        <span className="flex items-center"><MapPin size={16} className="mr-1"/> {job.location?.city || 'Remoto'}</span>
                                        <span className="flex items-center"><Wallet size={16} className="mr-1"/> {job.budget}</span>
                                        <span className="flex items-center"><Clock size={16} className="mr-1"/> {new Date(job.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-4 mt-2">
                                         <div className="flex items-center bg-slate-50 rounded-lg px-2 border border-slate-200">
                                            <MapPin size={14} className="text-slate-400 mr-2"/>
                                            <input value={editData.city} onChange={e => setEditData({...editData, city: e.target.value})} className="bg-transparent py-1 text-sm font-bold text-slate-700 outline-none w-32" placeholder="Città" />
                                         </div>
                                         <div className="flex items-center bg-slate-50 rounded-lg px-2 border border-slate-200">
                                            <Wallet size={14} className="text-slate-400 mr-2"/>
                                            <input value={editData.budget} onChange={e => setEditData({...editData, budget: e.target.value})} className="bg-transparent py-1 text-sm font-bold text-slate-700 outline-none w-32" placeholder="Budget" />
                                         </div>
                                    </div>
                                )}
                            </div>
                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : job.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                {job.status === 'OPEN' ? 'Aperta' : job.status === 'CANCELLED' ? 'Chiusa' : job.status === 'ARCHIVED' ? 'Archiviata' : job.status}
                            </span>
                        </div>
                        <div className="space-y-6 relative z-10">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase">Descrizione</h3>
                                {!isEditing ? (
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                                ) : (
                                    <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} rows={6} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-700 text-sm focus:border-indigo-600 outline-none resize-none" />
                                )}
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
                        {!isPro && job.status !== 'COMPLETED' && (
                             <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleUpdateJob} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700"><Save size={16} /> Salva</button>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200"><X size={16} /> Annulla</button>
                                    </>
                                ) : (
                                    <>
                                        {canEditOrDelete && (
                                            <>
                                                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 hover:text-indigo-600 transition-colors"><Edit3 size={16} /> Modifica</button>
                                                <button onClick={handleDeleteJob} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-colors"><Trash2 size={16} /> Elimina</button>
                                            </>
                                        )}
                                        {canClose && <button onClick={handleCloseJob} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 hover:text-slate-800 transition-colors"><Ban size={16} /> Chiudi Richiesta</button>}
                                        {canArchive && <button onClick={handleArchiveJob} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-100 transition-colors"><Archive size={16} /> Archivia</button>}
                                    </>
                                )}
                             </div>
                        )}
                    </div>
                    {!isPro && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black text-slate-900">Preventivi Ricevuti ({quotes.length})</h2>
                            {quotes.length === 0 ? (
                                <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">Nessun preventivo ancora ricevuto.</div>
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
                                            <button onClick={() => navigate(`/dashboard/quote/${q.id}?tab=${activeTab}`)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 text-sm">Dettagli</button>
                                            {q.status === 'PENDING' && (job.status === 'OPEN' || job.status === 'IN_PROGRESS') && (
                                                <button onClick={() => handleAcceptQuote(q)} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 text-sm shadow-lg shadow-indigo-100">Accetta</button>
                                            )}
                                            {q.status === 'ACCEPTED' && <span className="px-5 py-2.5 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-sm flex items-center"><Check size={16} className="mr-2" /> Accettato</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1">
                    {isPro ? (
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl sticky top-24">
                            {myQuote ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={32} /></div>
                                    <h3 className="font-black text-xl text-slate-900">Preventivo Inviato</h3>
                                    <button onClick={() => navigate(`/dashboard/quote/${myQuote.id}?tab=${activeTab}`)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl mt-6">Vedi il tuo preventivo</button>
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
                                    <button onClick={handleSendQuote} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all">Invia Offerta</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-indigo-50 p-6 rounded-[32px] sticky top-24">
                            <h3 className="font-bold text-indigo-900 mb-2">Consiglio</h3>
                            <p className="text-sm text-indigo-700/80">Riceverai una notifica per ogni nuovo preventivo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const QuoteDetailView: React.FC<{ user: User, isPro: boolean }> = ({ user, isPro }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || (isPro ? 'quotes' : 'my-requests'); 

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
            window.location.reload();
        }
    };

    if (loading) return <div className="p-10 text-center">Caricamento...</div>;
    if (!quote || !job) return <div className="p-10 text-center">Preventivo non trovato.</div>;

    const isAccepted = quote.status === 'ACCEPTED';

    return (
        <div className="animate-fade-simple max-w-[1250px] mx-auto w-full">
             <button onClick={() => navigate(`/dashboard?tab=${activeTab}`)} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold text-sm transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Torna indietro
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><FileText size={24} /></div>
                            <div><h2 className="text-2xl font-black text-slate-900">{job.category}</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Richiesta Originale</p></div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase">Descrizione Progetto</h3>
                                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                                <span className="flex items-center"><MapPin size={16} className="mr-1"/> {job.location?.city || 'Remoto'}</span>
                                <span className="flex items-center"><Wallet size={16} className="mr-1"/> Budget: {job.budget}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-xl sticky top-24">
                        <div className={`p-8 text-white ${isAccepted ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2">{isPro ? 'Il tuo preventivo' : 'Preventivo ricevuto'}</div>
                                    <h1 className="text-4xl font-black">{quote.price} €</h1>
                                    <div className="text-white/80 font-medium mt-1">Tempistiche: {quote.timeline}</div>
                                </div>
                                {isAccepted && <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md"><Check size={32} className="text-white" /></div>}
                            </div>
                        </div>
                        <div className="p-8 space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Messaggio</h3>
                                <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 italic border border-slate-100 text-base leading-relaxed">"{quote.message}"</div>
                            </div>
                            <div className={`p-6 rounded-[24px] border-2 transition-all ${isAccepted ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAccepted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                        {isAccepted ? <Phone size={20} /> : <Lock size={20} />}
                                    </div>
                                    <div><h3 className={`font-black text-base ${isAccepted ? 'text-emerald-900' : 'text-slate-500'}`}>{isAccepted ? 'Contatti Sbloccati' : 'Contatti Nascosti'}</h3></div>
                                </div>
                                {isAccepted && contact ? (
                                    <div className="space-y-3 animate-in fade-in">
                                        <div><label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Nome</label><div className="font-bold text-slate-900">{contact.brandName || contact.name}</div></div>
                                        <div><label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Email</label><div className="font-bold text-slate-900 break-all">{contact.email}</div></div>
                                        <div><label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Telefono</label><div className="font-bold text-slate-900">{contact.phoneNumber || 'Non specificato'}</div></div>
                                    </div>
                                ) : !isPro && !isAccepted && (
                                    <button onClick={handleAccept} className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-sm">Accetta e Vedi Contatti <ArrowRight size={16} /></button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, onLogout }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User>(initialUser);
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);
  const activeRole = roleOverride || user.role;
  const isPro = activeRole === UserRole.PROFESSIONAL;
  const currentTab = searchParams.get('tab') || (isPro ? 'leads' : 'my-requests');
  const isRecoveryMode = searchParams.get('mode') === 'recovery';

  // State vari
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [clientQuoteFilter, setClientQuoteFilter] = useState<'all' | 'with-quotes' | 'no-quotes'>('all');
  const [matchedLeads, setMatchedLeads] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<JobRequest[]>([]);
  const [sentQuotes, setSentQuotes] = useState<Quote[]>([]);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
  const [viewedJobs, setViewedJobs] = useState<Set<string>>(new Set());
  const [viewedWonIds, setViewedWonIds] = useState<Set<string>>(new Set());
  const [allJobsCache, setAllJobsCache] = useState<JobRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [hasUnseenLeads, setHasUnseenLeads] = useState(false);
  const [hasUnseenWon, setHasUnseenWon] = useState(false);
  const [settingsView, setSettingsView] = useState<'menu' | 'profile_edit' | 'services'>('menu');
  const [profileForm, setProfileForm] = useState<User>(user);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Ref for password section
  const passwordSectionRef = useRef<HTMLDivElement>(null);

  // AUTO-OPEN PROFILE EDIT IF RECOVERY MODE & SCROLL
  useEffect(() => {
      if (isRecoveryMode && currentTab === 'settings') {
          setSettingsView('profile_edit');
          // Wait for render then scroll
          setTimeout(() => {
              passwordSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
      }
  }, [isRecoveryMode, currentTab]);

  useEffect(() => {
      setAvailableCategories(contentService.getCategories());
  }, []);

  const refreshData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingData(true);
    setFetchError(false);
    try {
        const latestUser = await authService.getCurrentUser();
        if (latestUser) {
            setUser(latestUser);
            setProfileForm(latestUser);
        }
        if (latestUser?.role === UserRole.PROFESSIONAL) {
            const matches = await jobService.getMatchesForPro(latestUser);
            setMatchedLeads(matches);
            const allQuotes = await jobService.getQuotes();
            setSentQuotes(allQuotes.filter(q => q.proId === latestUser.id));
            const all = await jobService.getJobs();
            setAllJobsCache(all);
        } else if (latestUser) {
            const allJobs = await jobService.getJobs();
            const allQuotes = await jobService.getQuotes();
            const myJobsFiltered = allJobs.filter(j => j.clientId === latestUser.id);
            const myJobIds = new Set(myJobsFiltered.map(j => j.id));
            const relatedQuotes = allQuotes.filter(q => myJobIds.has(q.jobId));
            setClientQuotes(relatedQuotes);
            setMyJobs(myJobsFiltered);
        }
    } catch (e) { 
        setFetchError(true);
    } finally { 
        if (showLoading) setIsLoadingData(false); 
    }
  }, []);

  useEffect(() => { refreshData(true); }, [currentTab, refreshData]);

  const handleUpdatePassword = async () => {
      if (newPassword !== confirmPassword) { setPasswordMessage("Le password non coincidono."); return; }
      if (newPassword.length < 6) { setPasswordMessage("Minimo 6 caratteri."); return; }
      setIsSavingProfile(true);
      try {
          await authService.updateUserPassword(newPassword);
          setPasswordMessage("Password aggiornata correttamente.");
          setNewPassword(''); setConfirmPassword('');
          // Se in recovery mode, pulisci l'URL dopo il successo
          if (isRecoveryMode) navigate('/dashboard?tab=settings');
      } catch (e: any) {
          setPasswordMessage(`Errore: ${e.message}`);
      } finally { setIsSavingProfile(false); }
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
        alert("Profilo aggiornato!");
     } catch(e: any) { alert(e.message); } 
     finally { setIsSavingProfile(false); }
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

  const handleJobClick = (jobId: string) => {
      if (!viewedJobs.has(jobId)) {
          const newSet = new Set(viewedJobs);
          newSet.add(jobId);
          setViewedJobs(newSet);
          localStorage.setItem('chiediunpro_viewed_jobs', JSON.stringify(Array.from(newSet)));
          setHasUnseenLeads(matchedLeads.some(m => !newSet.has(m.job.id)));
      }
      navigate(`/dashboard/job/${jobId}?tab=${currentTab}`);
  };

  const handleQuoteClick = (quote: Quote) => {
      if (quote.status === 'ACCEPTED' && !viewedWonIds.has(quote.id)) {
          const newSet = new Set(viewedWonIds);
          newSet.add(quote.id);
          setViewedWonIds(newSet);
          localStorage.setItem('chiediunpro_viewed_won', JSON.stringify(Array.from(newSet)));
          const remainingUnseen = sentQuotes.filter(q => q.status === 'ACCEPTED' && !newSet.has(q.id)).length > 0;
          setHasUnseenWon(remainingUnseen);
      }
      navigate(`/dashboard/quote/${quote.id}?tab=${currentTab}`);
  };

  const handleRefill = async () => {
      if ((user.credits || 0) >= 30) { alert("Hai già il massimo dei crediti gratuiti (30)."); return; }
      await jobService.refillCredits(user.id);
      refreshData();
      alert("Crediti ricaricati a 30!");
  };

  const FilterControls = () => (
      <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-in fade-in">
          {currentTab === 'my-requests' && (
              <div className="relative group">
                  <select value={clientQuoteFilter} onChange={(e) => setClientQuoteFilter(e.target.value as any)} className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-10 pr-10 rounded-xl font-bold text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all hover:border-indigo-300 w-full sm:w-auto">
                      <option value="all">Tutti gli stati</option>
                      <option value="with-quotes">Con preventivi</option>
                      <option value="no-quotes">In attesa</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-600 transition-colors"><MessageSquare size={16} /></div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
              </div>
          )}
          <div className="relative group">
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-10 pr-10 rounded-xl font-bold text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all hover:border-indigo-300 w-full sm:w-auto">
                  <option value="newest">Più recenti</option>
                  <option value="oldest">Meno recenti</option>
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-600 transition-colors">{sortOrder === 'newest' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}</div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
          </div>
          <div className="relative group">
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-10 pr-10 rounded-xl font-bold text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all hover:border-indigo-300 w-full sm:w-auto">
                  <option value="all">Tutte le categorie</option>
                  {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-600 transition-colors"><Filter size={16} /></div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
          </div>
      </div>
  );

  const filteredLeads = matchedLeads
      .filter(item => !sentQuotes.some(q => q.jobId === item.job.id))
      .filter(item => filterCategory === 'all' || item.job.category === filterCategory)
      .sort((a, b) => sortOrder === 'newest' ? new Date(b.job.createdAt).getTime() - new Date(a.job.createdAt).getTime() : new Date(a.job.createdAt).getTime() - new Date(b.job.createdAt).getTime());

  const filteredMyJobs = myJobs
      .filter(job => job.status !== 'ARCHIVED')
      .filter(job => filterCategory === 'all' || job.category === filterCategory)
      .filter(job => {
          const quoteCount = clientQuotes.filter(q => q.jobId === job.id).length;
          if (clientQuoteFilter === 'with-quotes') return quoteCount > 0;
          if (clientQuoteFilter === 'no-quotes') return quoteCount === 0;
          return true;
      })
      .sort((a, b) => sortOrder === 'newest' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const filteredArchivedJobs = myJobs
      .filter(job => job.status === 'ARCHIVED')
      .filter(job => filterCategory === 'all' || job.category === filterCategory)
      .sort((a, b) => sortOrder === 'newest' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const filteredQuotes = sentQuotes
      .filter(q => currentTab === 'won' ? q.status === 'ACCEPTED' : q.status !== 'ACCEPTED')
      .filter(q => {
          if (filterCategory === 'all') return true;
          const job = allJobsCache.find(j => j.id === q.jobId);
          return job?.category === filterCategory;
      })
      .sort((a, b) => sortOrder === 'newest' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const renderDashboardContent = () => (
      <div className="max-w-[1250px] mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
                {currentTab === 'leads' ? 'Opportunità' : 
                    currentTab === 'quotes' ? 'Preventivi Inviati' :
                    currentTab === 'my-requests' ? 'Le mie Richieste' :
                    currentTab === 'archived' ? 'Richieste Archiviate' :
                    currentTab === 'won' ? 'I tuoi Successi' :
                    currentTab === 'settings' ? `Ciao, ${user.name.split(' ')[0]}` :
                    currentTab === 'billing' ? 'Crediti' : 'Dashboard'}
                </h1>
                <p className="text-slate-400 font-medium text-lg">
                    {currentTab === 'settings' ? 'Gestisci il tuo profilo e le tue preferenze.' :
                     currentTab === 'won' ? 'Congratulazioni! Ecco i lavori che hai conquistato.' :
                     currentTab === 'archived' ? 'Storico delle tue richieste passate.' :
                     newLeadsCount > 0 ? `🔥 ${newLeadsCount} Nuove opportunità appena arrivate!` : 'Bentornato nella tua dashboard.'}
                </p>
            </div>
            
            <div className="flex items-center gap-4">
                {!isPro && currentTab === 'my-requests' && (
                    <Link to="/post-job" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center">
                        <Plus className="mr-2" size={20} /> Nuova Richiesta
                    </Link>
                )}
                {isPro && (currentTab === 'leads' || currentTab === 'quotes' || currentTab === 'won') && (
                    <div className="bg-white px-6 py-3 rounded-[24px] border border-slate-100 shadow-sm flex items-center min-w-[220px]">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mr-4"><Coins size={20} /></div>
                        <div className="mr-4">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crediti</div>
                            <div className="text-xl font-black text-slate-900 leading-none mt-1">{user.credits}</div>
                        </div>
                        <div className="h-8 w-px bg-slate-100 mr-4"></div>
                        <button onClick={() => navigate('/dashboard?tab=billing')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline uppercase tracking-wide">Ricarica</button>
                    </div>
                )}
            </div>
        </header>

        {(currentTab === 'leads' || currentTab === 'my-requests' || currentTab === 'archived' || currentTab === 'quotes' || currentTab === 'won') && (
            <FilterControls />
        )}

        {isLoadingData && !fetchError && matchedLeads.length === 0 && myJobs.length === 0 && (
            <div className="py-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div></div>
        )}

        {fetchError && (
             <div className="py-20 text-center flex flex-col items-center justify-center animate-in fade-in">
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6"><WifiOff size={32} /></div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Impossibile caricare i dati</h3>
                 <p className="text-slate-500 mb-6 max-w-md">Sembra esserci un problema di connessione o il server non risponde. Riprova tra un attimo.</p>
                 <button onClick={() => refreshData(true)} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"><RefreshCw size={18} /> Riprova</button>
             </div>
        )}

        {!isLoadingData && !fetchError && (
            <>
                {currentTab === 'leads' && (
                    <div className="space-y-6">
                        {filteredLeads.length > 0 ? (
                            filteredLeads.map(({ job, matchScore }) => (
                                <div key={job.id} onClick={() => handleJobClick(job.id)} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col md:flex-row gap-6 items-start animate-fade-simple">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        {getCategoryIcon(job.category)}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{job.category}</h3>
                                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><TrendingUp size={10} /> {matchScore}% MATCH</span>
                                            {!viewedJobs.has(job.id) && <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-200 shrink-0 self-center" title="Nuova richiesta"></div>}
                                        </div>
                                        <p className="text-slate-600 text-sm mb-4 line-clamp-2 font-medium">{job.description}</p>
                                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            <span className="flex items-center gap-1"><MapPin size={12}/> {job.location?.city || 'Remoto'}</span>
                                            <span className="flex items-center gap-1"><Wallet size={12}/> {job.budget}</span>
                                            <span className="flex items-center gap-1"><Clock size={12}/> {new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="self-center">
                                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all"><ChevronRight size={20} /></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-[24px]">Nessuna opportunità trovata con i filtri attuali.</div>
                        )}
                    </div>
                )}

                {currentTab === 'my-requests' && (
                    <div className="space-y-6">
                         {filteredMyJobs.length > 0 ? filteredMyJobs.map(job => {
                             const quoteCount = clientQuotes.filter(q => q.jobId === job.id).length;
                             return (
                                <div key={job.id} onClick={() => navigate(`/dashboard/job/${job.id}?tab=${currentTab}`)} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-indigo-600 cursor-pointer transition-all flex flex-col md:flex-row gap-6 group">
                                     <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">{getCategoryIcon(job.category)}</div>
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{job.category}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-1 mb-2">{job.description}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
                                            {job.status === 'OPEN' || job.status === 'IN_PROGRESS' ? (
                                                quoteCount > 0 ? (
                                                    <span className="px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700">{quoteCount === 1 ? '1 PREVENTIVO' : `${quoteCount} PREVENTIVI`}</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-700">IN ATTESA</span>
                                                )
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded uppercase ${job.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{job.status === 'CANCELLED' ? 'Chiusa' : job.status}</span>
                                            )}
                                            <span className="flex items-center gap-1 ml-auto sm:ml-0"><Clock size={12}/> {new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="self-center">
                                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all"><ChevronRight size={20} /></div>
                                    </div>
                                </div>
                             );
                         }) : (
                            <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-[24px]">Nessuna richiesta trovata.</div>
                         )}
                    </div>
                )}
                
                {currentTab === 'archived' && (
                    <div className="space-y-6">
                         {filteredArchivedJobs.length > 0 ? filteredArchivedJobs.map(job => {
                             const quoteCount = clientQuotes.filter(q => q.jobId === job.id).length;
                             return (
                                <div key={job.id} onClick={() => navigate(`/dashboard/job/${job.id}?tab=${currentTab}`)} className="bg-slate-50 opacity-75 p-6 rounded-[24px] border border-slate-200 hover:border-slate-300 cursor-pointer transition-all flex flex-col md:flex-row gap-6 group grayscale-[0.5] hover:grayscale-0">
                                     <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center shrink-0">{getCategoryIcon(job.category)}</div>
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-black text-slate-700">{job.category}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-1 mb-2">{job.description}</p>
                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                            <span className="px-2 py-0.5 rounded uppercase bg-slate-200 text-slate-500">Archiviata</span>
                                            <span>{quoteCount} Preventivi</span>
                                            <span className="flex items-center gap-1 ml-auto sm:ml-0"><Clock size={12}/> {new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="self-center">
                                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400"><ChevronRight size={20} /></div>
                                    </div>
                                </div>
                             );
                         }) : (
                            <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-[24px]">
                                <Archive size={48} className="mx-auto mb-4 text-slate-300" />
                                <p>Nessuna richiesta archiviata.</p>
                            </div>
                         )}
                    </div>
                )}

                {(currentTab === 'quotes' || currentTab === 'won') && (
                    <div className="space-y-6">
                         {filteredQuotes.length > 0 ? (
                             filteredQuotes.map(quote => {
                                 const job = allJobsCache.find(j => j.id === quote.jobId);
                                 const category = job?.category || 'Servizio';
                                 return (
                                     <div key={quote.id} onClick={() => handleQuoteClick(quote)} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col md:flex-row gap-6 items-start animate-fade-simple">
                                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${quote.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>{getCategoryIcon(category)}</div>
                                         <div className="flex-grow">
                                             <div className="flex items-center gap-3 mb-1">
                                                 <h3 className="text-lg font-black text-slate-900">{category}</h3>
                                                 {quote.status === 'ACCEPTED' && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1"><Trophy size={10} /> LAVORO VINTO</span>}
                                                 {quote.status === 'PENDING' && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-slate-200">IN ATTESA</span>}
                                                 {currentTab === 'won' && !viewedWonIds.has(quote.id) && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200 shrink-0 self-center" title="Nuovo lavoro vinto"></div>}
                                             </div>
                                             <p className="text-slate-600 text-sm mb-4 line-clamp-2 font-medium">{job?.description || quote.message}</p>
                                             <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                 <span className="flex items-center gap-1"><MapPin size={12}/> {job?.location?.city || 'Remoto'}</span>
                                                 <span className="flex items-center gap-1 text-indigo-600"><Euro size={12}/> Tua Offerta: {quote.price}€</span>
                                                 <span className="flex items-center gap-1"><Clock size={12}/> Inviato: {new Date(quote.createdAt).toLocaleDateString()}</span>
                                             </div>
                                         </div>
                                         <div className="self-center">
                                             <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all"><ChevronRight size={20} /></div>
                                         </div>
                                     </div>
                                 );
                             })
                         ) : (
                             <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-[24px]">
                                 {currentTab === 'won' ? (
                                    <>
                                        <Trophy size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p>Ancora nessun lavoro vinto con questi filtri. Continua a inviare proposte!</p>
                                    </>
                                 ) : (
                                    <>
                                        <Send size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p>Nessun preventivo trovato.</p>
                                        <button onClick={() => navigate('/dashboard?tab=leads')} className="text-indigo-600 font-bold hover:underline mt-2">Trova opportunità</button>
                                    </>
                                 )}
                             </div>
                         )}
                    </div>
                )}

                {currentTab === 'settings' && (
                     <div className="animate-in fade-in duration-300">
                        {settingsView === 'menu' ? (
                            <div className="divide-y divide-slate-50">
                                <div onClick={() => setSettingsView('profile_edit')} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl">
                                    <div className="flex items-center gap-4"><UserIcon size={24} className="text-indigo-600"/><h3 className="font-bold">Modifica Profilo</h3></div>
                                    <ChevronRight />
                                </div>
                                {user.role === UserRole.PROFESSIONAL && (
                                    <div onClick={() => setSettingsView('services')} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl">
                                        <div className="flex items-center gap-4"><Briefcase size={24} className="text-indigo-600"/><h3 className="font-bold">I miei servizi</h3></div>
                                        <ChevronRight />
                                    </div>
                                )}
                            </div>
                        ) : settingsView === 'profile_edit' ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <button onClick={() => setSettingsView('menu')}><ArrowLeft/></button>
                                    <h2 className="text-2xl font-black">Profilo</h2>
                                </div>
                                
                                {isRecoveryMode && (
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 flex gap-3 animate-pulse">
                                        <Key size={20} />
                                        <div>
                                            <strong>Cambio Password Richiesto</strong>
                                            <p className="text-xs">Inserisci la tua nuova password qui sotto.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase text-slate-400">Nome</label>
                                    <input value={profileForm.name} onChange={e=>setProfileForm({...profileForm, name: e.target.value})} className="w-full p-3 border rounded-xl" />
                                    {isPro && (
                                        <>
                                            <label className="text-xs font-black uppercase text-slate-400">Brand</label>
                                            <input value={profileForm.brandName || ''} onChange={e=>setProfileForm({...profileForm, brandName: e.target.value})} className="w-full p-3 border rounded-xl" />
                                            <label className="text-xs font-black uppercase text-slate-400">Bio</label>
                                            <textarea value={profileForm.bio || ''} onChange={e=>setProfileForm({...profileForm, bio: e.target.value})} className="w-full p-3 border rounded-xl" rows={4} />
                                        </>
                                    )}
                                    <div ref={passwordSectionRef} className={`pt-4 border-t ${isRecoveryMode ? 'bg-indigo-50 p-4 rounded-xl' : ''}`}>
                                        <h3 className="font-bold mb-4">Sicurezza</h3>
                                        <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Nuova Password" className="w-full p-3 border rounded-xl mb-3" />
                                        <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Conferma Password" className="w-full p-3 border rounded-xl mb-3" />
                                        {passwordMessage && <p className="text-sm font-bold text-indigo-600 mb-2">{passwordMessage}</p>}
                                        <button onClick={handleUpdatePassword} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">Aggiorna Password</button>
                                    </div>

                                    <button onClick={handleSaveProfile} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-4">Salva Modifiche</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <button onClick={() => setSettingsView('menu')} className="mb-4"><ArrowLeft/> Indietro</button>
                                <h2 className="text-2xl font-black mb-6">Servizi</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.values(ServiceCategory).map(cat => (
                                        <button key={cat} onClick={() => {
                                            const current = profileForm.offeredServices || [];
                                            const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
                                            setProfileForm({...profileForm, offeredServices: next});
                                        }} className={`p-3 border rounded-xl text-sm font-bold ${profileForm.offeredServices?.includes(cat) ? 'bg-indigo-600 text-white' : ''}`}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={handleSaveProfile} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-6">Salva Servizi</button>
                            </div>
                        )}
                     </div>
                )}

                {currentTab === 'billing' && (
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20 max-w-2xl">
                        <div className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-2">Bilancio Crediti</div>
                        <div className="text-7xl font-black mb-2 tracking-tighter">{user.credits && user.credits >= 999 ? '∞' : (user.credits ?? 0)}</div>
                        <button onClick={handleRefill} className="mt-4 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold">Ricarica a 30</button>
                    </div>
                )}
            </>
        )}
      </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen flex">
        <aside className="hidden lg:flex w-80 border-r border-slate-100 bg-white flex-col p-6 sticky top-[73px] h-[calc(100vh-73px)] z-20 shrink-0">
             <div className="space-y-2 flex-grow">
                {[{ id: 'leads', label: 'Opportunità', icon: <Star size={20} />, role: 'pro' },
                  { id: 'my-requests', label: 'Mie Richieste', icon: <FileText size={20} />, role: 'client' },
                  { id: 'quotes', label: 'Preventivi Inviati', icon: <Send size={20} />, role: 'pro' },
                  { id: 'won', label: 'Lavori Ottenuti', icon: <Trophy size={20} />, role: 'pro' },
                  { id: 'archived', label: 'Archiviate', icon: <Archive size={20} />, role: 'client' },
                  { id: 'settings', label: 'Profilo', icon: <Settings size={20} />, role: 'all' },
                  { id: 'billing', label: 'Crediti', icon: <Coins size={20} />, role: 'pro' }]
                .filter(item => item.role === 'all' || (isPro && item.role === 'pro') || (!isPro && item.role === 'client'))
                .map((item) => (
                    <Link key={item.id} to={`/dashboard?tab=${item.id}`} className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${currentTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}>
                        <div className="flex items-center space-x-3 w-full">
                            <div className="shrink-0">{item.icon}</div>
                            <span className="font-bold text-sm">{item.label}</span>
                            {item.id === 'leads' && hasUnseenLeads && <div className="w-2.5 h-2.5 bg-red-500 rounded-full ml-auto animate-pulse shadow-sm shadow-red-200 shrink-0"></div>}
                            {item.id === 'won' && hasUnseenWon && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full ml-auto animate-pulse shadow-sm shadow-emerald-200 shrink-0"></div>}
                        </div>
                    </Link>
                ))}
             </div>
        </aside>

        <main className="flex-grow p-4 lg:p-12 overflow-x-hidden">
             {currentTab === 'settings' ? (
                 <div className="max-w-2xl mx-auto bg-white p-8 rounded-[32px] border border-slate-100">
                    {settingsView === 'menu' ? (
                        <div className="divide-y divide-slate-50">
                            <div onClick={() => setSettingsView('profile_edit')} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl">
                                <div className="flex items-center gap-4"><UserIcon size={24} className="text-indigo-600"/><h3 className="font-bold">Modifica Profilo</h3></div>
                                <ChevronRight />
                            </div>
                            {user.role === UserRole.PROFESSIONAL && (
                                <div onClick={() => setSettingsView('services')} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl">
                                    <div className="flex items-center gap-4"><Briefcase size={24} className="text-indigo-600"/><h3 className="font-bold">I miei servizi</h3></div>
                                    <ChevronRight />
                                </div>
                            )}
                        </div>
                    ) : settingsView === 'profile_edit' ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-6">
                                <button onClick={() => setSettingsView('menu')}><ArrowLeft/></button>
                                <h2 className="text-2xl font-black">Profilo</h2>
                            </div>
                            
                            {isRecoveryMode && (
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 flex gap-3 animate-pulse">
                                    <Key size={20} />
                                    <div>
                                        <strong>Cambio Password Richiesto</strong>
                                        <p className="text-xs">Inserisci la tua nuova password qui sotto.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase text-slate-400">Nome</label>
                                <input value={profileForm.name} onChange={e=>setProfileForm({...profileForm, name: e.target.value})} className="w-full p-3 border rounded-xl" />
                                {isPro && (
                                    <>
                                        <label className="text-xs font-black uppercase text-slate-400">Brand</label>
                                        <input value={profileForm.brandName || ''} onChange={e=>setProfileForm({...profileForm, brandName: e.target.value})} className="w-full p-3 border rounded-xl" />
                                        <label className="text-xs font-black uppercase text-slate-400">Bio</label>
                                        <textarea value={profileForm.bio || ''} onChange={e=>setProfileForm({...profileForm, bio: e.target.value})} className="w-full p-3 border rounded-xl" rows={4} />
                                    </>
                                )}
                                <div ref={passwordSectionRef} className={`pt-4 border-t ${isRecoveryMode ? 'bg-indigo-50 p-4 rounded-xl' : ''}`}>
                                    <h3 className="font-bold mb-4">Sicurezza</h3>
                                    <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Nuova Password" className="w-full p-3 border rounded-xl mb-3" />
                                    <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Conferma Password" className="w-full p-3 border rounded-xl mb-3" />
                                    {passwordMessage && <p className="text-sm font-bold text-indigo-600 mb-2">{passwordMessage}</p>}
                                    <button onClick={handleUpdatePassword} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">Aggiorna Password</button>
                                </div>

                                <button onClick={handleSaveProfile} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-4">Salva Modifiche</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <button onClick={() => setSettingsView('menu')} className="mb-4"><ArrowLeft/> Indietro</button>
                            <h2 className="text-2xl font-black mb-6">Servizi</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.values(ServiceCategory).map(cat => (
                                    <button key={cat} onClick={() => {
                                        const current = profileForm.offeredServices || [];
                                        const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
                                        setProfileForm({...profileForm, offeredServices: next});
                                    }} className={`p-3 border rounded-xl text-sm font-bold ${profileForm.offeredServices?.includes(cat) ? 'bg-indigo-600 text-white' : ''}`}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleSaveProfile} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-6">Salva Servizi</button>
                        </div>
                    )}
                 </div>
             ) : (
                 <Routes>
                     <Route path="/" element={renderDashboardContent()} />
                     <Route path="/job/:id" element={<JobDetailView user={user} isPro={isPro} refreshParent={refreshData} />} />
                     <Route path="/quote/:id" element={<QuoteDetailView user={user} isPro={isPro} />} />
                 </Routes>
             )}
        </main>
    </div>
  );
};

export default Dashboard;