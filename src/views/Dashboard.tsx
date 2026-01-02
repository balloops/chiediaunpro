import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, JobRequest, Quote, ServiceCategory } from '../../types';
import { 
  FileText, Send, Settings, Plus, Star, Trophy, MapPin, Wallet, Clock, 
  ChevronRight, ArrowLeft, ArrowRight, Check, Phone, Lock, 
  Code, ShoppingCart, Palette, Camera, Video, BarChart3, AppWindow, Box, 
  Briefcase, HelpCircle, LogOut, Coins, RefreshCw, WifiOff,
  User as UserIcon, TrendingUp, Euro, Filter, ChevronDown, ArrowUp, ArrowDown,
  Trash2, Edit3, XCircle, Save, X, Ban, Archive
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
    const activeTab = searchParams.get('tab') || (isPro ? 'leads' : 'my-requests'); // Get current tab context

    const [job, setJob] = useState<JobRequest | null>(null);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Pro Quote Form State
    const [quotePrice, setQuotePrice] = useState('');
    const [quoteMessage, setQuoteMessage] = useState('');
    const [quoteTimeline, setQuoteTimeline] = useState('');

    // Client Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        description: '',
        budget: '',
        city: ''
    });

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
                // Navigate to the quote detail to see contact info immediately
                navigate(`/dashboard/quote/${quote.id}?tab=${activeTab}`);
            } catch (e) {
                console.error(e);
            }
        }
    };

    // Client Actions: Update, Delete, Close, Archive
    const handleUpdateJob = async () => {
        if (!job) return;
        try {
            await jobService.updateJobDetails(job.id, {
                description: editData.description,
                budget: editData.budget,
                location: { city: editData.city }
            });
            setIsEditing(false);
            // Refresh local data
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
            <button 
                onClick={() => navigate(`/dashboard?tab=${activeTab}`)} 
                className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold text-sm transition-colors"
            >
                <ArrowLeft size={18} className="mr-2" /> Torna alla lista
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Job Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
                        
                        {/* Header & Status */}
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
                                            <input 
                                                value={editData.city} 
                                                onChange={e => setEditData({...editData, city: e.target.value})}
                                                className="bg-transparent py-1 text-sm font-bold text-slate-700 outline-none w-32"
                                                placeholder="Città"
                                            />
                                         </div>
                                         <div className="flex items-center bg-slate-50 rounded-lg px-2 border border-slate-200">
                                            <Wallet size={14} className="text-slate-400 mr-2"/>
                                            <input 
                                                value={editData.budget} 
                                                onChange={e => setEditData({...editData, budget: e.target.value})}
                                                className="bg-transparent py-1 text-sm font-bold text-slate-700 outline-none w-32"
                                                placeholder="Budget"
                                            />
                                         </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* CUSTOM LABEL LOGIC - RICHIESTA UTENTE */}
                            {(() => {
                                if (!isPro && (job.status === 'OPEN' || job.status === 'IN_PROGRESS')) {
                                    if (quotes.length > 0) {
                                        return (
                                            <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                                                {quotes.length === 1 ? '1 PREVENTIVO RICEVUTO' : `${quotes.length} PREVENTIVI RICEVUTI`}
                                            </span>
                                        );
                                    } else {
                                        return (
                                            <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                                IN ATTESA DI PREVENTIVI
                                            </span>
                                        );
                                    }
                                }
                                
                                // Default labels for Pro or other statuses
                                return (
                                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                                        job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 
                                        job.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                        job.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-600' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {job.status === 'OPEN' ? 'Aperta' : job.status === 'CANCELLED' ? 'Chiusa' : job.status === 'ARCHIVED' ? 'Archiviata' : job.status}
                                    </span>
                                );
                            })()}
                        </div>

                        {/* Description */}
                        <div className="space-y-6 relative z-10">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase flex justify-between">
                                    Descrizione
                                    {isEditing && <span className="text-indigo-600 text-xs">Modifica in corso...</span>}
                                </h3>
                                {!isEditing ? (
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                                ) : (
                                    <textarea 
                                        value={editData.description}
                                        onChange={e => setEditData({...editData, description: e.target.value})}
                                        rows={6}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-700 text-sm focus:border-indigo-600 outline-none resize-none"
                                    />
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

                        {/* Client Actions Toolbar */}
                        {!isPro && job.status !== 'COMPLETED' && (
                             <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleUpdateJob} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
                                            <Save size={16} /> Salva Modifiche
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200">
                                            <X size={16} /> Annulla
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {canEditOrDelete && (
                                            <>
                                                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 hover:text-indigo-600 transition-colors">
                                                    <Edit3 size={16} /> Modifica
                                                </button>
                                                <button onClick={handleDeleteJob} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-colors">
                                                    <Trash2 size={16} /> Elimina
                                                </button>
                                            </>
                                        )}
                                        {canClose && (
                                            <button onClick={handleCloseJob} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                                                <Ban size={16} /> Chiudi Richiesta
                                            </button>
                                        )}
                                        {canArchive && (
                                            <button onClick={handleArchiveJob} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-100 transition-colors">
                                                <Archive size={16} /> Archivia
                                            </button>
                                        )}
                                        {job.status === 'CANCELLED' && (
                                            <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-sm font-bold flex items-center gap-2 cursor-not-allowed">
                                                <Ban size={16} /> Richiesta Chiusa
                                            </span>
                                        )}
                                        {job.status === 'ARCHIVED' && (
                                            <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-sm font-bold flex items-center gap-2 cursor-not-allowed">
                                                <Archive size={16} /> Richiesta Archiviata
                                            </span>
                                        )}
                                    </>
                                )}
                             </div>
                        )}
                    </div>

                    {/* CLIENT VIEW: List Quotes */}
                    {!isPro && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black text-slate-900">Preventivi Ricevuti ({quotes.length})</h2>
                            {quotes.length === 0 ? (
                                <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
                                    Nessun preventivo ancora ricevuto. Modifica la richiesta per renderla più appetibile!
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
                                            {q.status === 'PENDING' && job.status === 'OPEN' && (
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

  // Filter & Sort State
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Data State
  const [matchedLeads, setMatchedLeads] = useState<{ job: JobRequest; matchScore: number }[]>([]);
  const [myJobs, setMyJobs] = useState<JobRequest[]>([]);
  const [sentQuotes, setSentQuotes] = useState<Quote[]>([]);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
  
  // UX State
  const [viewedJobs, setViewedJobs] = useState<Set<string>>(new Set());
  const [viewedWonIds, setViewedWonIds] = useState<Set<string>>(new Set()); // Tracks seen "Won" quotes
  
  // Cache to resolve job info for sent quotes
  const [allJobsCache, setAllJobsCache] = useState<JobRequest[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  
  // Realtime New Lead Notification
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [hasUnseenLeads, setHasUnseenLeads] = useState(false); // Sidebar notification state
  const [hasUnseenWon, setHasUnseenWon] = useState(false); // Sidebar notification for Won jobs

  // Profile Hub State
  const [settingsView, setSettingsView] = useState<'menu' | 'profile_edit' | 'services'>('menu');
  const [profileForm, setProfileForm] = useState<User>(user);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Reset filters when changing tabs
  useEffect(() => {
      setSortOrder('newest');
      setFilterCategory('all');
  }, [currentTab]);

  // Load categories for filter
  useEffect(() => {
      setAvailableCategories(contentService.getCategories());
  }, []);

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
                
                // Client Side Logic: Sort jobs by latest activity (received quotes)
                const myJobsFiltered = allJobs.filter(j => j.clientId === latestUser.id);
                const myJobIds = new Set(myJobsFiltered.map(j => j.id));
                const relatedQuotes = allQuotes.filter(q => myJobIds.has(q.jobId));
                setClientQuotes(relatedQuotes);

                setMyJobs(myJobsFiltered);
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

  // Load viewed state from localStorage
  useEffect(() => {
    const storedJobs = localStorage.getItem('chiediunpro_viewed_jobs');
    if (storedJobs) {
        try { setViewedJobs(new Set(JSON.parse(storedJobs))); } catch (e) { console.error(e); }
    }
    const storedWon = localStorage.getItem('chiediunpro_viewed_won');
    if (storedWon) {
        try { setViewedWonIds(new Set(JSON.parse(storedWon))); } catch(e) { console.error(e); }
    }
  }, []);

  // Sync Unseen Notifications
  useEffect(() => {
      // 1. Unseen Leads (Pro)
      if (isPro && matchedLeads.length > 0) {
          const hasUnread = matchedLeads.some(m => !viewedJobs.has(m.job.id));
          setHasUnseenLeads(hasUnread);
      } else {
          setHasUnseenLeads(false);
      }

      // 2. Unseen Won Jobs (Pro)
      if (isPro && sentQuotes.length > 0) {
          const wonQuotes = sentQuotes.filter(q => q.status === 'ACCEPTED');
          const hasUnseenW = wonQuotes.some(q => !viewedWonIds.has(q.id));
          setHasUnseenWon(hasUnseenW);
      } else {
          setHasUnseenWon(false);
      }

  }, [matchedLeads, viewedJobs, sentQuotes, viewedWonIds, isPro]);

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
         alert(`Errore durante il salvataggio: ${e.message}`); 
     } 
     finally { setIsSavingProfile(false); }
  };

  const handleUpdatePassword = async () => {
      if (newPassword !== confirmPassword) {
          setPasswordMessage("Le password non coincidono.");
          return;
      }
      if (newPassword.length < 6) {
          setPasswordMessage("La password deve essere di almeno 6 caratteri.");
          return;
      }
      setIsSavingProfile(true);
      try {
          await authService.updateUserPassword(newPassword);
          setPasswordMessage("Password aggiornata correttamente.");
          setNewPassword('');
          setConfirmPassword('');
      } catch (e: any) {
          setPasswordMessage(`Errore: ${e.message}`);
      } finally {
          setIsSavingProfile(false);
      }
  };

  const handleUpgrade = async (plan: any) => {
    await jobService.updateUserPlan(user.id, plan);
    refreshData();
    alert(`Piano ${plan} attivato!`);
  };

  const handleRoleSwitch = () => {
      if (roleOverride) {
          setRoleOverride(null);
          navigate('/dashboard?tab=leads');
      } else {
          if (user.role === UserRole.PROFESSIONAL) {
              setRoleOverride(UserRole.CLIENT);
              navigate('/dashboard?tab=my-requests');
          } else {
              navigate('/register?role=pro');
          }
      }
  };

  // Helper to mark a job as viewed when clicking it
  const handleJobClick = (jobId: string) => {
      if (!viewedJobs.has(jobId)) {
          const newSet = new Set(viewedJobs);
          newSet.add(jobId);
          setViewedJobs(newSet);
          localStorage.setItem('chiediunpro_viewed_jobs', JSON.stringify(Array.from(newSet)));
          // Update dot state immediately
          setHasUnseenLeads(matchedLeads.some(m => !newSet.has(m.job.id)));
      }
      // Navigate maintaining the current tab context
      navigate(`/dashboard/job/${jobId}?tab=${currentTab}`);
  };

  // Helper to mark a WON quote as viewed
  const handleQuoteClick = (quote: Quote) => {
      if (quote.status === 'ACCEPTED' && !viewedWonIds.has(quote.id)) {
          const newSet = new Set(viewedWonIds);
          newSet.add(quote.id);
          setViewedWonIds(newSet);
          localStorage.setItem('chiediunpro_viewed_won', JSON.stringify(Array.from(newSet)));
          // Update dot state
          const remainingUnseen = sentQuotes.filter(q => q.status === 'ACCEPTED' && !newSet.has(q.id)).length > 0;
          setHasUnseenWon(remainingUnseen);
      }
      navigate(`/dashboard/quote/${quote.id}?tab=${currentTab}`);
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Filter Bar Component
  const FilterControls = () => (
      <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-in fade-in">
          <div className="relative group">
              <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-10 pr-10 rounded-xl font-bold text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all hover:border-indigo-300 w-full sm:w-auto"
              >
                  <option value="newest">Più recenti</option>
                  <option value="oldest">Meno recenti</option>
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-600 transition-colors">
                  {sortOrder === 'newest' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={16} />
              </div>
          </div>

          <div className="relative group">
              <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-10 pr-10 rounded-xl font-bold text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all hover:border-indigo-300 w-full sm:w-auto"
              >
                  <option value="all">Tutte le categorie</option>
                  {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                  ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <Filter size={16} />
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={16} />
              </div>
          </div>
      </div>
  );

  // --- PROCESSING LISTS ---
  
  // Leads (Pro)
  const filteredLeads = matchedLeads
    .filter(item => filterCategory === 'all' || item.job.category === filterCategory)
    .sort((a, b) => {
        const dateA = new Date(a.job.createdAt).getTime();
        const dateB = new Date(b.job.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // My Requests (Client) - Active only
  const filteredMyJobs = myJobs
    .filter(job => job.status !== 'ARCHIVED')
    .filter(job => filterCategory === 'all' || job.category === filterCategory)
    .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
  // Archived Requests (Client)
  const filteredArchivedJobs = myJobs
    .filter(job => job.status === 'ARCHIVED')
    .filter(job => filterCategory === 'all' || job.category === filterCategory)
    .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Quotes / Won (Pro)
  const filteredQuotes = sentQuotes
    .filter(q => currentTab === 'won' ? q.status === 'ACCEPTED' : q.status !== 'ACCEPTED')
    .filter(q => {
        if (filterCategory === 'all') return true;
        const job = allJobsCache.find(j => j.id === q.jobId);
        return job?.category === filterCategory;
    })
    .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });


  // --- RENDER CONTENT (LISTS) ---
  const renderDashboardContent = () => (
      <div className="max-w-[1250px] mx-auto w-full">
        {/* Header */}
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
            
            {/* Right Side Header Action */}
            <div className="flex items-center gap-4">
                {!isPro && currentTab === 'my-requests' && (
                    <Link
                        to="/post-job"
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center"
                    >
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
                        <button 
                            onClick={() => navigate('/dashboard?tab=billing')}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline uppercase tracking-wide"
                        >
                            Ricarica
                        </button>
                    </div>
                )}
            </div>
        </header>

        {/* Filters (Only for list views) */}
        {(currentTab === 'leads' || currentTab === 'my-requests' || currentTab === 'archived' || currentTab === 'quotes' || currentTab === 'won') && (
            <FilterControls />
        )}

        {/* Loading State */}
        {isLoadingData && !fetchError && matchedLeads.length === 0 && myJobs.length === 0 && (
            <div className="py-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div></div>
        )}

        {/* Error State */}
        {fetchError && (
             <div className="py-20 text-center flex flex-col items-center justify-center animate-in fade-in">
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                     <WifiOff size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Impossibile caricare i dati</h3>
                 <p className="text-slate-500 mb-6 max-w-md">Sembra esserci un problema di connessione o il server non risponde. Riprova tra un attimo.</p>
                 <button 
                    onClick={() => refreshData(true)}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                 >
                    <RefreshCw size={18} /> Riprova
                 </button>
             </div>
        )}

        {/* Tab Content (Show only if not loading AND no error) */}
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
                                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                <TrendingUp size={10} /> {matchScore}% MATCH
                                            </span>
                                            {/* New Dot Logic - Individual Card */}
                                            {!viewedJobs.has(job.id) && (
                                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-200 shrink-0 self-center" title="Nuova richiesta"></div>
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
                            ))
                        ) : (
                            <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-[24px]">
                                Nessuna opportunità trovata con i filtri attuali.
                            </div>
                        )}
                    </div>
                )}

                {currentTab === 'my-requests' && (
                    <div className="space-y-6">
                         {filteredMyJobs.length > 0 ? filteredMyJobs.map(job => {
                             const quoteCount = clientQuotes.filter(q => q.jobId === job.id).length;
                             return (
                                <div key={job.id} onClick={() => navigate(`/dashboard/job/${job.id}?tab=${currentTab}`)} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-indigo-600 cursor-pointer transition-all flex flex-col md:flex-row gap-6 group">
                                     <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                                        {getCategoryIcon(job.category)}
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{job.category}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-1 mb-2">{job.description}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
                                            {/* LIST VIEW LABELS */}
                                            {job.status === 'OPEN' || job.status === 'IN_PROGRESS' ? (
                                                quoteCount > 0 ? (
                                                    <span className="px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700">
                                                        {quoteCount === 1 ? '1 PREVENTIVO' : `${quoteCount} PREVENTIVI`}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-700">
                                                        IN ATTESA
                                                    </span>
                                                )
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded uppercase ${
                                                    job.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {job.status === 'CANCELLED' ? 'Chiusa' : job.status}
                                                </span>
                                            )}
                                            
                                            <span className="flex items-center gap-1 ml-auto sm:ml-0"><Clock size={12}/> {new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="self-center">
                                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                             );
                         }) : (
                            <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-[24px]">
                                Nessuna richiesta trovata.
                            </div>
                         )}
                    </div>
                )}
                
                {currentTab === 'archived' && (
                    <div className="space-y-6">
                         {filteredArchivedJobs.length > 0 ? filteredArchivedJobs.map(job => {
                             const quoteCount = clientQuotes.filter(q => q.jobId === job.id).length;
                             return (
                                <div key={job.id} onClick={() => navigate(`/dashboard/job/${job.id}?tab=${currentTab}`)} className="bg-slate-50 opacity-75 p-6 rounded-[24px] border border-slate-200 hover:border-slate-300 cursor-pointer transition-all flex flex-col md:flex-row gap-6 group grayscale-[0.5] hover:grayscale-0">
                                     <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center shrink-0">
                                        {getCategoryIcon(job.category)}
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-black text-slate-700">{job.category}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-1 mb-2">{job.description}</p>
                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                            <span className="px-2 py-0.5 rounded uppercase bg-slate-200 text-slate-500">
                                                Archiviata
                                            </span>
                                            <span>{quoteCount} Preventivi</span>
                                            <span className="flex items-center gap-1 ml-auto sm:ml-0"><Clock size={12}/> {new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="self-center">
                                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                                            <ChevronRight size={20} />
                                        </div>
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
                                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${quote.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {getCategoryIcon(category)}
                                         </div>
                                         
                                         <div className="flex-grow">
                                             <div className="flex items-center gap-3 mb-1">
                                                 <h3 className="text-lg font-black text-slate-900">{category}</h3>
                                                 {quote.status === 'ACCEPTED' && (
                                                     <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                                                         <Trophy size={10} /> LAVORO VINTO
                                                     </span>
                                                 )}
                                                 {quote.status === 'PENDING' && (
                                                     <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-slate-200">
                                                         IN ATTESA
                                                     </span>
                                                 )}
                                                 
                                                 {/* Dot for new won jobs */}
                                                 {currentTab === 'won' && !viewedWonIds.has(quote.id) && (
                                                     <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200 shrink-0 self-center" title="Nuovo lavoro vinto"></div>
                                                 )}
                                             </div>
                                             
                                             <p className="text-slate-600 text-sm mb-4 line-clamp-2 font-medium">
                                                 {job?.description || quote.message}
                                             </p>
                                             
                                             <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                 <span className="flex items-center gap-1"><MapPin size={12}/> {job?.location?.city || 'Remoto'}</span>
                                                 <span className="flex items-center gap-1 text-indigo-600"><Euro size={12}/> Tua Offerta: {quote.price}€</span>
                                                 <span className="flex items-center gap-1"><Clock size={12}/> Inviato: {new Date(quote.createdAt).toLocaleDateString()}</span>
                                             </div>
                                         </div>

                                         <div className="self-center">
                                             <div
                                                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all"
                                             >
                                                <ChevronRight size={20} />
                                             </div>
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

                {/* --- PROFILE HUB --- */}
                {currentTab === 'settings' && (
                     <div className="animate-in fade-in duration-300">
                        {/* Profile Header - Visible only in Menu */}
                        {settingsView === 'menu' ? (
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-200">
                                        {getInitials(user.name)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
                                        <p className="text-slate-500 font-medium">{user.role === UserRole.PROFESSIONAL ? 'Professionista Verificato' : 'Cliente'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => { setSettingsView('menu'); setPasswordMessage(''); }} 
                                className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold text-sm transition-colors"
                            >
                                <ArrowLeft size={18} className="mr-2" /> Torna al menu
                            </button>
                        )}

                        {/* MENU VIEW */}
                        {settingsView === 'menu' && (
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="divide-y divide-slate-50">
                                    {/* Item: Profile */}
                                    <div onClick={() => setSettingsView('profile_edit')} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <UserIcon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">Il mio profilo</h3>
                                                <p className="text-xs text-slate-400">Modifica foto, nome, email, telefono e posizione.</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600" />
                                    </div>

                                    {/* Item: Services (Pro Only) */}
                                    {user.role === UserRole.PROFESSIONAL && (
                                        <div onClick={() => setSettingsView('services')} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <Briefcase size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">I miei servizi</h3>
                                                    <p className="text-xs text-slate-400">Gestisci e visualizza i servizi offerti.</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600" />
                                        </div>
                                    )}

                                    {/* Item: Billing (Pro Only) */}
                                    {user.role === UserRole.PROFESSIONAL && (
                                        <div onClick={() => navigate('/dashboard?tab=billing')} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <Wallet size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">Il mio conto</h3>
                                                    <p className="text-xs text-slate-400">Ricarica il tuo conto, controlla il saldo.</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600" />
                                        </div>
                                    )}

                                    {/* Item: Support */}
                                    <div onClick={() => navigate('/help')} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <HelpCircle size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">Assistenza</h3>
                                                <p className="text-xs text-slate-400">Hai bisogno di aiuto?</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600" />
                                    </div>

                                    {/* Item: Role Switch */}
                                    <div onClick={handleRoleSwitch} className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <RefreshCw size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">Passa al profilo {activeRole === UserRole.PROFESSIONAL ? 'Cliente' : 'Pro'}</h3>
                                                <p className="text-xs text-slate-400">Cambia modalità di visualizzazione.</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600" />
                                    </div>

                                    {/* Item: Privacy */}
                                    <div className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <Lock size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">Dati e privacy</h3>
                                                <p className="text-xs text-slate-400">Gestisci i tuoi dati personali.</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600" />
                                    </div>

                                    {/* Item: Logout */}
                                    <div onClick={onLogout} className="p-6 flex items-center justify-between hover:bg-red-50 cursor-pointer transition-colors group border-t border-slate-100">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                                                <LogOut size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 group-hover:text-red-600">Esci</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EDIT PROFILE VIEW */}
                        {settingsView === 'profile_edit' && (
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 max-w-2xl mx-auto space-y-8">
                                {/* Title Context */}
                                <div className="mb-6">
                                    <h2 className="text-3xl font-black text-slate-900">Il mio Profilo</h2>
                                    <p className="text-slate-500">Gestisci le tue informazioni personali.</p>
                                </div>

                                <div>
                                    <h2 className="text-xl font-black text-slate-900 mb-6">Dati Personali</h2>
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
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase">Telefono</label>
                                            <input type="tel" value={profileForm.phoneNumber || ''} onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                                        </div>
                                        {isPro && (
                                            <div>
                                                <label className="text-xs font-black text-slate-400 uppercase">Bio</label>
                                                <textarea rows={4} value={profileForm.bio || ''} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                                            </div>
                                        )}
                                        <div className="flex gap-4 pt-4">
                                            <button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
                                                {isSavingProfile ? 'Salvataggio...' : 'Salva Modifiche'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100">
                                    <h2 className="text-xl font-black text-slate-900 mb-6">Sicurezza</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase">Nuova Password</label>
                                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="••••••••" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase">Conferma Password</label>
                                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="••••••••" />
                                        </div>
                                        {passwordMessage && (
                                            <p className={`text-xs font-bold ${passwordMessage.includes('Errore') || passwordMessage.includes('non coincidono') ? 'text-red-500' : 'text-green-500'}`}>
                                                {passwordMessage}
                                            </p>
                                        )}
                                        <div className="flex gap-4 pt-2">
                                            <button onClick={handleUpdatePassword} disabled={isSavingProfile || !newPassword} className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all">
                                                Aggiorna Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button onClick={() => setSettingsView('menu')} className="w-full px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">
                                        Indietro
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SERVICES VIEW */}
                        {settingsView === 'services' && (
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 max-w-2xl mx-auto">
                                <h2 className="text-3xl font-black text-slate-900 mb-2">Gestisci Servizi</h2>
                                <p className="text-slate-500 mb-8">Seleziona le categorie di servizi che offri.</p>
                                
                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    {Object.values(ServiceCategory).map(cat => {
                                        const isSelected = profileForm.offeredServices?.includes(cat);
                                        return (
                                            <button 
                                                key={cat} 
                                                onClick={() => {
                                                    const current = profileForm.offeredServices || [];
                                                    const updated = isSelected ? current.filter(c => c !== cat) : [...current, cat];
                                                    setProfileForm({...profileForm, offeredServices: updated});
                                                }}
                                                className={`p-4 border-2 rounded-2xl text-xs font-black transition-all ${
                                                isSelected 
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-white hover:border-slate-200'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
                                        Salva Servizi
                                    </button>
                                    <button onClick={() => setSettingsView('menu')} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">
                                        Indietro
                                    </button>
                                </div>
                            </div>
                        )}
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
      </div>
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
                    { id: 'archived', label: 'Archiviate', icon: <Archive size={20} />, role: 'client' },
                    { id: 'settings', label: 'Profilo', icon: <Settings size={20} />, role: 'all' },
                    { id: 'billing', label: 'Crediti', icon: <Coins size={20} />, role: 'pro' }
                ]
                .filter(item => item.role === 'all' || (isPro && item.role === 'pro') || (!isPro && item.role === 'client'))
                .map((item) => (
                    <Link
                        key={item.id}
                        to={`/dashboard?tab=${item.id}`} // URL is the source of truth
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${currentTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600 font-medium'}`}
                    >
                        <div className="flex items-center space-x-3 w-full">
                            <div className="shrink-0">{item.icon}</div>
                            <span className="font-bold text-sm hidden lg:block whitespace-nowrap">{item.label}</span>
                            {/* Dots for Leads */}
                            {item.id === 'leads' && hasUnseenLeads && (
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full ml-auto animate-pulse shadow-sm shadow-red-200 shrink-0"></div>
                            )}
                            {/* Dots for Won Jobs */}
                            {item.id === 'won' && hasUnseenWon && (
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full ml-auto animate-pulse shadow-sm shadow-emerald-200 shrink-0"></div>
                            )}
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
    </div>
  );
};

export default Dashboard;