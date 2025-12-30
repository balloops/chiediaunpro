import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole, JobRequest, Quote } from '../types';
import { jobService } from '../services/jobService';
import { 
  MapPin, Wallet, Clock, Briefcase, MessageSquare, 
  Search
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        if (user.role === UserRole.CLIENT) {
           const allJobs = await jobService.getJobs();
           const myJobs = allJobs.filter(j => j.clientId === user.id);
           
           const allQuotes = await jobService.getQuotes();
           const receivedQuotes = allQuotes.filter(q => myJobs.some(j => j.id === q.jobId));
           
           if (mounted) {
             setJobs(myJobs);
             setQuotes(receivedQuotes);
           }
        } else if (user.role === UserRole.PROFESSIONAL) {
           const matches = await jobService.getMatchesForPro(user);
           
           const allQuotes = await jobService.getQuotes();
           const myQuotes = allQuotes.filter(q => q.proId === user.id);
           
           if (mounted) {
             setJobs(matches.map(m => m.job));
             setQuotes(myQuotes);
           }
        }
      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [user]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-slate-50">
       <p className="text-slate-400 font-medium animate-pulse">Caricamento dashboard...</p>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen p-6 pb-20">
      <div className="max-w-[1250px] mx-auto animate-in fade-in duration-500">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">Ciao, {user.name.split(' ')[0]}!</h1>
            <p className="text-slate-500 font-medium">
              {user.role === UserRole.CLIENT 
                ? 'Ecco il riepilogo delle tue richieste.' 
                : 'Ecco le opportunità più adatte a te.'}
            </p>
          </div>
          {user.role === UserRole.CLIENT && (
            <Link to="/post-job" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg shadow-indigo-200">
               <Briefcase size={18} className="mr-2" />
               Nuova Richiesta
            </Link>
          )}
        </header>

        {user.role === UserRole.CLIENT ? (
           <ClientDashboard jobs={jobs} quotes={quotes} />
        ) : (
           <ProDashboard jobs={jobs} quotes={quotes} />
        )}
      </div>
    </div>
  );
};

const ClientDashboard = ({ jobs, quotes }: { jobs: JobRequest[], quotes: Quote[] }) => {
  return (
    <div className="space-y-8">
       <h2 className="text-xl font-black text-slate-800 flex items-center">
         <Briefcase size={20} className="mr-2 text-indigo-600" />
         Le tue Richieste
       </h2>
       
       {jobs.length === 0 ? (
         <div className="bg-white p-12 rounded-[24px] border border-slate-200 text-center shadow-sm">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Briefcase size={32} className="text-slate-300" />
           </div>
           <p className="text-slate-500 font-medium mb-6">Non hai ancora pubblicato richieste.</p>
           <Link to="/post-job" className="text-indigo-600 font-bold hover:underline">Pubblica la prima richiesta</Link>
         </div>
       ) : (
         <div className="grid gap-6">
           {jobs.map(job => {
             const jobQuotes = quotes.filter(q => q.jobId === job.id);
             return (
               <div key={job.id} className="bg-white p-6 rounded-[24px] border border-slate-200 hover:shadow-lg transition-all group">
                 <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 mb-6">
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                           <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg tracking-wider border border-indigo-100">
                             {job.category}
                           </span>
                           <span className="text-xs text-slate-400 font-bold flex items-center">
                             <Clock size={12} className="mr-1" />
                             {new Date(job.createdAt).toLocaleDateString()}
                           </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                           <span className="flex items-center bg-slate-50 px-2 py-1 rounded-lg"><MapPin size={14} className="mr-1" /> {job.location?.city || 'Remoto'}</span>
                           <span className="flex items-center bg-slate-50 px-2 py-1 rounded-lg"><Wallet size={14} className="mr-1" /> {job.budget}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end space-y-2">
                       {job.status === 'OPEN' ? (
                          <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center shadow-sm ${jobQuotes.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                             {jobQuotes.length > 0 ? (
                               <><MessageSquare size={14} className="mr-2" /> {jobQuotes.length} Preventivi</>
                             ) : (
                               <><Clock size={14} className="mr-2" /> In Attesa</>
                             )}
                          </div>
                       ) : (
                          <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-500 shadow-sm">
                             {job.status === 'IN_PROGRESS' ? 'In Corso' : 'Chiuso'}
                          </span>
                       )}
                    </div>
                 </div>
                 
                 {/* Quotes Section */}
                 {jobQuotes.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-50">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Preventivi Ricevuti</h4>
                       <div className="grid gap-3">
                          {jobQuotes.map(q => (
                             <div key={q.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center hover:bg-slate-100 transition-colors cursor-pointer">
                                <div className="flex items-center space-x-3">
                                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-indigo-600 border border-slate-200">
                                      {q.proName.charAt(0)}
                                   </div>
                                   <div>
                                      <div className="font-bold text-slate-700 text-sm">{q.proName}</div>
                                      <div className="text-[10px] text-slate-400 font-medium">Inviato il {new Date(q.createdAt).toLocaleDateString()}</div>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <div className="font-bold text-slate-900">{q.price}€</div>
                                   <div className="text-[10px] text-slate-500">{q.timeline}</div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
               </div>
             );
           })}
         </div>
       )}
    </div>
  );
}

const ProDashboard = ({ jobs, quotes }: { jobs: JobRequest[], quotes: Quote[] }) => {
   return (
      <div className="grid lg:grid-cols-3 gap-8 items-start">
         <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center">
               <Search size={20} className="mr-2 text-indigo-600" />
               Opportunità per te
            </h2>
            {jobs.length === 0 ? (
               <div className="bg-white p-12 rounded-[24px] border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Nessuna nuova opportunità trovata per le tue competenze.</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {jobs.map(job => (
                     <div key={job.id} className="bg-white p-6 rounded-[24px] border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-4">
                           <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg tracking-wider border border-indigo-100">
                              {job.category}
                           </span>
                           <span className="text-xs text-slate-400 font-bold">{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">{job.description}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                           <div className="flex space-x-4 text-xs font-bold text-slate-500">
                              <span className="flex items-center bg-slate-50 px-2 py-1 rounded-lg"><MapPin size={14} className="mr-1" /> {job.location?.city || 'Remoto'}</span>
                              <span className="flex items-center bg-slate-50 px-2 py-1 rounded-lg"><Wallet size={14} className="mr-1" /> {job.budget}</span>
                           </div>
                           <button className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 group-hover:shadow-indigo-200">
                              Invia Preventivo
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
         
         <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800">I tuoi Preventivi</h2>
            <div className="bg-white p-6 rounded-[24px] border border-slate-200 min-h-[300px] shadow-sm">
               {quotes.length === 0 ? (
                  <div className="text-center py-10">
                     <p className="text-sm text-slate-400 font-medium">Non hai ancora inviato preventivi.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {quotes.map(q => (
                        <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                           <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-slate-700 text-xs">Job #{q.jobId.substring(0,4)}</span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                 q.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 
                                 q.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
                              }`}>{q.status}</span>
                           </div>
                           <div className="flex justify-between items-end">
                              <div className="text-[10px] text-slate-400">{new Date(q.createdAt).toLocaleDateString()}</div>
                              <div className="font-black text-slate-900 text-sm">{q.price}€</div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

export default Dashboard;