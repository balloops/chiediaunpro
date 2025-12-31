
import React, { useState, useEffect } from 'react';
import { User, UserRole, JobRequest, PricingPlan, SiteContent, EventLog, FormDefinition, FormField } from '../../types';
import { 
  Users, Briefcase, BarChart3, Trash2, ShieldCheck, Search, AlertCircle, TrendingUp, 
  FileText, MessageSquare, CheckCircle, XCircle, Layers, Plus, Terminal, Clock, 
  Layout, CreditCard, Edit3, Save, Globe, Settings, LogOut, Euro, X, Check, 
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Image as ImageIcon, BookOpen, Zap, UserCog, HelpCircle, Upload
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { jobService } from '../../services/jobService';
import { logService } from '../../services/logService';
import { contentService } from '../../services/contentService';
import { Link, useSearchParams } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  
  // Data State
  const [stats, setStats] = useState({
    totalUsers: 0,
    proCount: 0,
    clientCount: 0,
    totalJobs: 0,
    totalQuotes: 0,
    avgQuotes: 0,
    successRate: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [categories, setCategories] = useState<string[]>(contentService.getCategories());
  const [plans, setPlans] = useState<PricingPlan[]>(contentService.getPlans());
  const [cmsContent, setCmsContent] = useState<SiteContent>(contentService.getContent());
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  
  // CMS Section State
  const [openCmsSection, setOpenCmsSection] = useState<string | null>('branding');

  // Form Editor State
  const [editingFormCategory, setEditingFormCategory] = useState<string | null>(null);
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null);
  const [newField, setNewField] = useState<Partial<FormField>>({ type: 'text', label: '', options: [] });
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = async () => {
    // Sync calls (CMS stuff stays local for now)
    setLogs(logService.getLogs());
    setCategories(contentService.getCategories());
    setPlans(contentService.getPlans());
    
    // Async CMS fetch
    const fetchedContent = await contentService.fetchContent();
    setCmsContent(fetchedContent);

    // Async calls to DB
    try {
      const fetchedStats = await adminService.getStats();
      setStats(fetchedStats as any);

      const fetchedUsers = await adminService.getAllUsers();
      setUsers(fetchedUsers);

      const fetchedJobs = await jobService.getJobs();
      setJobs(fetchedJobs);
    } catch (e) {
      console.error("Error fetching admin data", e);
    }
  };

  // --- Handlers ---

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo utente?')) {
      await adminService.deleteUser(id);
      refreshData();
    }
  };

  const handleVerifyUser = async (userId: string, isVerified: boolean) => {
    await adminService.toggleUserVerification(userId, isVerified);
    logService.log('USER_VERIFICATION_CHANGE', userId, { isVerified });
    refreshData();
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (window.confirm(`Sei sicuro di voler cambiare il ruolo di questo utente in ${newRole}?`)) {
      await adminService.updateUserRole(userId, newRole);
      logService.log('USER_ROLE_CHANGE', userId, { newRole });
      refreshData();
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (window.confirm('Rimuovere questa richiesta dalla piattaforma?')) {
      await adminService.deleteJob(id);
      refreshData();
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      contentService.addCategory(newCategory.trim());
      setNewCategory('');
      refreshData();
    }
  };

  const handleStartEditCategory = (cat: string) => {
    setEditingCategory(cat);
    setEditCategoryValue(cat);
  };

  const handleSaveEditCategory = () => {
    if (editingCategory && editCategoryValue.trim()) {
      contentService.updateCategory(editingCategory, editCategoryValue);
      setEditingCategory(null);
      setEditCategoryValue('');
      refreshData();
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryValue('');
  };

  const handleDeleteCategory = (cat: string) => {
    if (window.confirm(`Eliminare la categoria "${cat}"?`)) {
      contentService.removeCategory(cat);
      refreshData();
    }
  };

  // --- Form Editor Handlers ---

  const handleEditForm = (cat: string) => {
    const def = contentService.getFormDefinition(cat);
    setFormDefinition(def);
    setEditingFormCategory(cat);
  };

  const handleSaveForm = () => {
    if (formDefinition) {
      contentService.saveFormDefinition(formDefinition);
      alert('Form aggiornato con successo!');
      setEditingFormCategory(null);
      setFormDefinition(null);
    }
  };

  const handleAddField = () => {
    if (formDefinition && newField.label && newField.type) {
      const field: FormField = {
        id: `field_${Date.now()}`,
        label: newField.label,
        type: newField.type,
        options: newField.type === 'select' || newField.type === 'multiselect' || newField.type === 'checkbox_group' ? (newField.options || []) : undefined,
        required: true
      };
      setFormDefinition({
        ...formDefinition,
        fields: [...formDefinition.fields, field]
      });
      setNewField({ type: 'text', label: '', options: [] });
    }
  };

  const handleDeleteField = (fieldId: string) => {
    if (formDefinition) {
      setFormDefinition({
        ...formDefinition,
        fields: formDefinition.fields.filter(f => f.id !== fieldId)
      });
    }
  };

  const handleSavePlans = () => {
    contentService.savePlans(plans);
    alert('Piani aggiornati con successo!');
  };

  const handleUpdatePlan = (index: number, field: keyof PricingPlan, value: any) => {
    const newPlans = [...plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setPlans(newPlans);
  };

  const handleSaveCMS = async () => {
    try {
        await contentService.saveContent(cmsContent);
        alert('Contenuti salvati correttamente su Database! Le modifiche sono ora visibili a tutti.');
    } catch (e: any) {
        alert('Errore durante il salvataggio su Database: ' + e.message);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCmsContent({
          ...cmsContent,
          branding: {
            ...cmsContent.branding,
            logoUrl: base64String
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to safely update nested CMS state
  const updateCmsHome = (section: keyof SiteContent['home'], field: string, value: any) => {
    setCmsContent(prev => ({
      ...prev,
      home: {
        ...prev.home,
        [section]: {
          ...prev.home[section],
          [field]: value
        }
      }
    }));
  };

  const updateCmsHow = (section: keyof SiteContent['howItWorks'], field: string, value: any) => {
    setCmsContent(prev => ({
      ...prev,
      howItWorks: {
        ...prev.howItWorks,
        [section]: {
          ...prev.howItWorks[section],
          [field]: value
        }
      }
    }));
  };

  // --- Filters ---

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Render Components ---

  const renderSidebar = () => (
    <aside className="hidden lg:flex w-20 lg:w-72 bg-white border-r border-slate-200 flex-col fixed h-full z-20">
      <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
        <div className="bg-slate-900 text-white p-2 rounded-xl">
          <ShieldCheck size={24} />
        </div>
        <span className="font-black text-lg text-slate-900 hidden lg:block">Admin Panel</span>
      </div>
      <div className="flex-grow p-4 space-y-2 overflow-y-auto">
        {[
          { id: 'overview', label: 'Dashboard', icon: <BarChart3 size={20} /> },
          { id: 'users', label: 'Gestione Utenti', icon: <Users size={20} /> },
          { id: 'requests', label: 'Moderazione Job', icon: <Briefcase size={20} /> },
          { id: 'categories', label: 'Categorie & Form', icon: <Layers size={20} /> },
          { id: 'plans', label: 'Piani & Prezzi', icon: <CreditCard size={20} /> },
          { id: 'cms', label: 'Contenuti Sito', icon: <Globe size={20} /> },
          { id: 'logs', label: 'System Logs', icon: <Terminal size={20} /> }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id as any); setEditingFormCategory(null); }}
            className={`w-full flex items-center space-x-3 p-3.5 rounded-xl transition-all font-bold text-sm ${
              activeTab === item.id 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.icon}
            <span className="hidden lg:block">{item.label}</span>
          </button>
        ))}
      </div>
      {/* Logout Removed from Sidebar - Handled by Navbar */}
    </aside>
  );

  const CmsInput = ({ label, value, onChange, type = 'text', rows = 3 }: any) => (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
      {type === 'textarea' ? (
        <textarea 
          rows={rows} 
          value={value} 
          onChange={onChange} 
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-600 transition-all resize-none"
        />
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={onChange} 
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
        />
      )}
    </div>
  );

  const CmsSection = ({ id, title, icon, children }: any) => (
    <div className={`bg-white rounded-[24px] border transition-all duration-300 overflow-hidden ${openCmsSection === id ? 'border-indigo-200 shadow-xl shadow-indigo-500/5' : 'border-slate-200 shadow-sm'}`}>
      <button 
        onClick={() => setOpenCmsSection(openCmsSection === id ? null : id)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${openCmsSection === id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
            {icon}
          </div>
          <h3 className="font-black text-xl text-slate-900">{title}</h3>
        </div>
        {openCmsSection === id ? <ChevronUp size={20} className="text-indigo-600" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>
      
      {openCmsSection === id && (
        <div className="p-8 border-t border-slate-50 space-y-6 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen flex">
      {renderSidebar()}
      
      <main className="flex-grow ml-0 lg:ml-72 p-8 lg:p-12">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            {activeTab === 'overview' && 'Panoramica'}
            {activeTab === 'users' && 'Gestione Utenti'}
            {activeTab === 'requests' && 'Moderazione Richieste'}
            {activeTab === 'categories' && 'Categorie Servizi'}
            {activeTab === 'plans' && 'Gestione Piani'}
            {activeTab === 'cms' && 'Gestione Contenuti (CMS)'}
            {activeTab === 'logs' && 'Log di Sistema'}
          </h1>
          <p className="text-slate-500 font-medium">Benvenuto nel pannello di controllo amministrativo.</p>
        </header>

        {/* ... (Overview, Users, Requests, Categories code remains same) ... */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Utenti Totali', value: stats.totalUsers, sub: `${stats.proCount} Pro / ${stats.clientCount} Clienti`, icon: <Users className="text-blue-500" />, color: 'bg-blue-50' },
                { label: 'Job Attivi', value: stats.totalJobs, sub: 'Richieste sulla piattaforma', icon: <Briefcase className="text-indigo-500" />, color: 'bg-indigo-50' },
                { label: 'Preventivi', value: stats.totalQuotes, sub: `Media: ${stats.avgQuotes} per job`, icon: <MessageSquare className="text-emerald-500" />, color: 'bg-emerald-50' },
                { label: 'Success Rate', value: `${stats.successRate}%`, sub: 'Job conclusi con successo', icon: <TrendingUp className="text-amber-500" />, color: 'bg-amber-50' }
              ].map((s, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                  <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center mb-4`}>
                    {/* Fix: Cast to ReactElement<any> to allow 'size' prop override */}
                    {React.cloneElement(s.icon as React.ReactElement<any>, { size: 24 })}
                  </div>
                  <div className="text-3xl font-black text-slate-900 mb-1">{s.value}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                  <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] text-slate-500 font-medium">
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ... (Users Tab) ... */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <Search className="text-slate-400 ml-2" size={20} />
              <input 
                type="text" 
                placeholder="Cerca utente..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-grow bg-transparent outline-none text-sm font-medium"
              />
            </div>
            
            <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Utente</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Ruolo</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Verificato</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                {u.name} 
                                {u.role === UserRole.ADMIN && <ShieldCheck size={14} className="text-indigo-600" />}
                            </div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative inline-block">
                             <select 
                                value={u.role}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                                className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer outline-none border transition-all ${
                                   u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                   u.role === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                   'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                             >
                                <option value={UserRole.CLIENT}>Cliente</option>
                                <option value={UserRole.PROFESSIONAL}>Professional</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                             </select>
                             <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                <UserCog size={12} className={
                                   u.role === 'ADMIN' ? 'text-indigo-700' :
                                   u.role === 'PROFESSIONAL' ? 'text-blue-700' : 
                                   'text-slate-600'
                                } />
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           {u.role === UserRole.PROFESSIONAL ? (
                             <button 
                               onClick={() => handleVerifyUser(u.id, !u.isVerified)}
                               className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${u.isVerified ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                             >
                               {u.isVerified ? <CheckCircle size={12} /> : <XCircle size={12} />}
                               <span>{u.isVerified ? 'Verificato' : 'Non Verificato'}</span>
                             </button>
                           ) : (
                             <span className="text-slate-300 text-xs">-</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ... (Requests Tab) ... */}
        {activeTab === 'requests' && (
           <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid gap-4">
               {filteredJobs.length > 0 ? filteredJobs.map(job => (
                 <div key={job.id} className="bg-white p-6 rounded-[24px] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                          <Briefcase className="text-slate-400" size={24} />
                       </div>
                       <div>
                          <div className="font-bold text-slate-900">{job.title}</div>
                          <div className="text-xs text-slate-500">Cliente: {job.clientName} • Budget: {job.budget}</div>
                       </div>
                    </div>
                    <div className="flex items-center justify-end space-x-4">
                       <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                         {job.status}
                       </span>
                       <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                          <Trash2 size={18} />
                       </button>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-10 text-slate-400">Nessuna richiesta trovata.</div>
               )}
             </div>
           </div>
        )}

        {/* ... (Categories Tab) ... */}
        {activeTab === 'categories' && !editingFormCategory && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-[24px] border border-slate-100">
                 <h3 className="font-black text-lg text-slate-900 mb-6">Aggiungi Categoria</h3>
                 <div className="flex space-x-4">
                    <input 
                      type="text" 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nome nuova categoria (es. Cyber Security)"
                      className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-600 transition-colors"
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                    >
                       <Plus size={18} />
                       <span>Aggiungi</span>
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {categories.map((cat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group">
                       {editingCategory === cat ? (
                         <div className="flex items-center space-x-2 w-full">
                           <input 
                              type="text"
                              value={editCategoryValue}
                              onChange={(e) => setEditCategoryValue(e.target.value)}
                              className="flex-grow bg-slate-50 border border-indigo-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-900 outline-none"
                              autoFocus
                           />
                           <button onClick={handleSaveEditCategory} className="text-emerald-500 hover:text-emerald-700 p-1">
                             <Check size={18} />
                           </button>
                           <button onClick={handleCancelEditCategory} className="text-slate-400 hover:text-slate-600 p-1">
                             <X size={18} />
                           </button>
                         </div>
                       ) : (
                         <>
                           <div className="flex items-center space-x-3">
                              <span className="font-bold text-slate-700">{cat}</span>
                           </div>
                           <div className="flex items-center space-x-1">
                             <button 
                                onClick={() => handleEditForm(cat)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors mr-2"
                             >
                                <Settings size={14} />
                                <span>Form</span>
                             </button>
                             <button onClick={() => handleStartEditCategory(cat)} className="text-slate-300 hover:text-indigo-500 transition-colors p-1.5 rounded-lg hover:bg-indigo-50">
                                <Edit3 size={16} />
                             </button>
                             <button onClick={() => handleDeleteCategory(cat)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                                <Trash2 size={16} />
                             </button>
                           </div>
                         </>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* Form Editor View */}
        {activeTab === 'categories' && editingFormCategory && formDefinition && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
             <div className="flex items-center space-x-4 mb-6">
                <button onClick={() => setEditingFormCategory(null)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                   <X size={20} />
                </button>
                <h2 className="text-2xl font-black text-slate-900">Modifica Form: {editingFormCategory}</h2>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="bg-white p-8 rounded-[24px] border border-slate-100 space-y-6 h-fit">
                   <h3 className="font-bold text-lg border-b border-slate-100 pb-2">Impostazioni Generali</h3>
                   
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Richiedi Località (Città)</span>
                      <button 
                        onClick={() => setFormDefinition({...formDefinition, askLocation: !formDefinition.askLocation})}
                        className={`text-2xl ${formDefinition.askLocation ? 'text-indigo-600' : 'text-slate-300'}`}
                      >
                         {formDefinition.askLocation ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                   </div>

                   <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Opzioni Budget (Separate da virgola)</label>
                      <input 
                        type="text" 
                        value={formDefinition.budgetOptions.join(', ')}
                        onChange={(e) => setFormDefinition({...formDefinition, budgetOptions: e.target.value.split(',').map(s => s.trim())})}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm"
                      />
                   </div>

                   <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Placeholder Descrizione</label>
                      <input 
                        type="text" 
                        value={formDefinition.descriptionPlaceholder || ''}
                        onChange={(e) => setFormDefinition({...formDefinition, descriptionPlaceholder: e.target.value})}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm"
                      />
                   </div>
                </div>

                {/* Fields Builder */}
                <div className="bg-white p-8 rounded-[24px] border border-slate-100 space-y-6">
                   <h3 className="font-bold text-lg border-b border-slate-100 pb-2">Campi Personalizzati</h3>
                   
                   <div className="space-y-4">
                      {formDefinition.fields.map((field, idx) => (
                         <div key={field.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                            <div className="flex justify-between items-start">
                               <div>
                                  <div className="font-bold text-sm text-slate-900">{field.label}</div>
                                  <div className="text-xs text-slate-500 font-mono mt-1">Type: {field.type}</div>
                                  {field.options && (
                                     <div className="flex flex-wrap gap-1 mt-2">
                                        {field.options.map(o => (
                                           <span key={o} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600">{o}</span>
                                        ))}
                                     </div>
                                  )}
                               </div>
                               <button 
                                 onClick={() => handleDeleteField(field.id)}
                                 className="text-slate-400 hover:text-red-500 p-1"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>

                   <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-4 mt-6">
                      <h4 className="font-bold text-indigo-900 text-sm">Aggiungi Nuovo Campo</h4>
                      <input 
                        type="text" 
                        placeholder="Domanda (Label)"
                        value={newField.label}
                        onChange={(e) => setNewField({...newField, label: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                      <select 
                        value={newField.type}
                        onChange={(e) => setNewField({...newField, type: e.target.value as any})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm"
                      >
                         <option value="text">Testo Breve</option>
                         <option value="textarea">Testo Lungo</option>
                         <option value="select">Menu a Tendina</option>
                         <option value="multiselect">Selezione Multipla</option>
                         <option value="checkbox_group">Gruppo Checkbox</option>
                      </select>
                      
                      {['select', 'multiselect', 'checkbox_group'].includes(newField.type || '') && (
                         <div>
                            <input 
                              type="text" 
                              placeholder="Opzione (premi invio per aggiungere)"
                              value={newOption}
                              onChange={(e) => setNewOption(e.target.value)}
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter' && newOption.trim()) {
                                    setNewField({
                                       ...newField, 
                                       options: [...(newField.options || []), newOption.trim()]
                                    });
                                    setNewOption('');
                                 }
                              }}
                              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm mb-2"
                            />
                            <div className="flex flex-wrap gap-2">
                               {newField.options?.map(o => (
                                  <span key={o} className="px-2 py-1 bg-white rounded border border-slate-200 text-xs font-bold flex items-center">
                                     {o}
                                     <button onClick={() => setNewField({...newField, options: newField.options?.filter(x => x !== o)})} className="ml-1 text-red-400 hover:text-red-600"><X size={12} /></button>
                                  </span>
                               ))}
                            </div>
                         </div>
                      )}

                      <button 
                        onClick={handleAddField}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                         Aggiungi Campo al Form
                      </button>
                   </div>
                </div>
             </div>
             
             <div className="flex justify-end pt-6">
                <button 
                  onClick={handleSaveForm}
                  className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 transition-all flex items-center space-x-2"
                >
                   <Save size={20} />
                   <span>Salva Configurazione Form</span>
                </button>
             </div>
          </div>
        )}

        {/* ... (Plans Tab) ... */}
        {activeTab === 'plans' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-end">
                 <button onClick={handleSavePlans} className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white font-black rounded-xl shadow-lg hover:bg-emerald-700 transition-all">
                    <Save size={18} />
                    <span>Salva Modifiche</span>
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {plans.map((plan, idx) => (
                    <div key={plan.id} className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10">
                          <CreditCard size={100} />
                       </div>
                       <div className="relative z-10 space-y-4">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{plan.id} PLAN</div>
                          <div>
                             <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Piano</label>
                             <input 
                               type="text" 
                               value={plan.name}
                               onChange={(e) => handleUpdatePlan(idx, 'name', e.target.value)}
                               className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold mt-1"
                             />
                          </div>
                          <div>
                             <label className="text-[10px] font-bold text-slate-400 uppercase">Prezzo (€)</label>
                             <input 
                               type="number" 
                               value={plan.price}
                               onChange={(e) => handleUpdatePlan(idx, 'price', parseFloat(e.target.value))}
                               className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold mt-1"
                             />
                          </div>
                          <div>
                             <label className="text-[10px] font-bold text-slate-400 uppercase">Crediti Inclusi</label>
                             <input 
                               type="text" 
                               value={plan.credits}
                               onChange={(e) => handleUpdatePlan(idx, 'credits', e.target.value)}
                               className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold mt-1"
                             />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* CMS Tab */}
        {activeTab === 'cms' && (
           <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl pb-20">
              <div className="flex justify-end sticky top-0 bg-slate-50 py-4 z-30">
                 <button onClick={handleSaveCMS} className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
                    <Save size={18} />
                    <span>Pubblica Modifiche su DB</span>
                 </button>
              </div>

              {/* Branding */}
              <CmsSection id="branding" title="Branding & Identità" icon={<ImageIcon size={20} />}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CmsInput 
                      label="Nome Piattaforma" 
                      value={cmsContent.branding.platformName} 
                      onChange={(e: any) => setCmsContent({...cmsContent, branding: {...cmsContent.branding, platformName: e.target.value}})} 
                    />
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Logo Piattaforma</label>
                        <div className="flex items-center space-x-4">
                            {cmsContent.branding.logoUrl && (
                                <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 relative group">
                                    <img src={cmsContent.branding.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                    <button 
                                        onClick={() => setCmsContent({...cmsContent, branding: {...cmsContent.branding, logoUrl: ''}})}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                            <label className="flex-grow cursor-pointer group">
                                <div className="w-full p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center space-x-2 group-hover:border-indigo-400 transition-colors">
                                    <Upload size={20} className="text-slate-400 group-hover:text-indigo-600" />
                                    <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600">Carica Logo</span>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        </div>
                    </div>
                 </div>
              </CmsSection>

              {/* Home Hero */}
              <CmsSection id="home-hero" title="Home: Hero Section" icon={<Layout size={20} />}>
                 <CmsInput 
                    label="Titolo Hero" 
                    value={cmsContent.home.hero.title} 
                    onChange={(e: any) => updateCmsHome('hero', 'title', e.target.value)} 
                 />
                 <CmsInput 
                    label="Sottotitolo Hero" 
                    type="textarea"
                    value={cmsContent.home.hero.subtitle} 
                    onChange={(e: any) => updateCmsHome('hero', 'subtitle', e.target.value)} 
                 />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CmsInput 
                      label="Badge Testo" 
                      value={cmsContent.home.hero.badgeText} 
                      onChange={(e: any) => updateCmsHome('hero', 'badgeText', e.target.value)} 
                    />
                    <CmsInput 
                      label="Pulsante Primario" 
                      value={cmsContent.home.hero.ctaPrimary} 
                      onChange={(e: any) => updateCmsHome('hero', 'ctaPrimary', e.target.value)} 
                    />
                    <CmsInput 
                      label="Pulsante Secondario" 
                      value={cmsContent.home.hero.ctaSecondary} 
                      onChange={(e: any) => updateCmsHome('hero', 'ctaSecondary', e.target.value)} 
                    />
                    <CmsInput 
                      label="Punteggio Recensioni" 
                      value={cmsContent.home.hero.reviewScore} 
                      onChange={(e: any) => updateCmsHome('hero', 'reviewScore', e.target.value)} 
                    />
                 </div>
              </CmsSection>

              {/* Home Stats */}
              <CmsSection id="home-stats" title="Home: Statistiche" icon={<BarChart3 size={20} />}>
                 <div className="grid grid-cols-3 gap-6">
                    <CmsInput label="Utenti (es. +1k)" value={cmsContent.home.stats.users} onChange={(e: any) => updateCmsHome('stats', 'users', e.target.value)} />
                    <CmsInput label="Progetti (es. 500+)" value={cmsContent.home.stats.projects} onChange={(e: any) => updateCmsHome('stats', 'projects', e.target.value)} />
                    <CmsInput label="Rating (es. 4.9)" value={cmsContent.home.stats.rating} onChange={(e: any) => updateCmsHome('stats', 'rating', e.target.value)} />
                 </div>
              </CmsSection>

              {/* Home Features */}
              <CmsSection id="home-features" title="Home: Features & Vantaggi" icon={<ShieldCheck size={20} />}>
                 <CmsInput label="Titolo Sezione" value={cmsContent.home.features.title} onChange={(e: any) => updateCmsHome('features', 'title', e.target.value)} />
                 <CmsInput label="Descrizione Sezione" type="textarea" value={cmsContent.home.features.description} onChange={(e: any) => updateCmsHome('features', 'description', e.target.value)} />
                 
                 <div className="space-y-6 mt-4 border-t border-slate-100 pt-6">
                    {cmsContent.home.features.items.map((item, idx) => (
                       <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <h4 className="font-bold text-xs uppercase text-slate-400 mb-3">Vantaggio {idx + 1}</h4>
                          <div className="space-y-4">
                             <input 
                               type="text" 
                               value={item.title} 
                               onChange={e => {
                                  // Fix: Avoid mutating state directly
                                  const newItems = cmsContent.home.features.items.map((it, i) => 
                                    i === idx ? { ...it, title: e.target.value } : it
                                  );
                                  updateCmsHome('features', 'items', newItems);
                               }}
                               className="w-full p-3 bg-white border border-slate-200 rounded-lg font-bold text-sm"
                               placeholder="Titolo vantaggio"
                             />
                             <textarea 
                               rows={2}
                               value={item.description}
                               onChange={e => {
                                  // Fix: Avoid mutating state directly
                                  const newItems = cmsContent.home.features.items.map((it, i) => 
                                    i === idx ? { ...it, description: e.target.value } : it
                                  );
                                  updateCmsHome('features', 'items', newItems);
                               }}
                               className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm resize-none"
                               placeholder="Descrizione vantaggio"
                             />
                          </div>
                       </div>
                    ))}
                 </div>
              </CmsSection>

              {/* Help Center / FAQ Editor - NEW SECTION */}
              <CmsSection id="help-center" title="Centro Assistenza (FAQ)" icon={<HelpCircle size={20} />}>
                 <CmsInput 
                    label="Titolo Pagina" 
                    value={cmsContent.helpCenter?.title || 'Come possiamo aiutarti?'} 
                    onChange={(e: any) => setCmsContent({...cmsContent, helpCenter: {...cmsContent.helpCenter, title: e.target.value}})} 
                 />

                 <div className="mt-8">
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-900">Domande Frequenti (FAQ)</h4>
                        <button 
                           onClick={() => {
                              const newFaq = { question: 'Nuova domanda?', answer: 'Risposta qui.', category: 'general' };
                              setCmsContent({...cmsContent, helpCenter: {...cmsContent.helpCenter, items: [newFaq as any, ...cmsContent.helpCenter?.items || []]}});
                           }}
                           className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                        >
                           + Aggiungi FAQ
                        </button>
                     </div>
                     
                     <div className="space-y-4">
                        {(cmsContent.helpCenter?.items || []).map((faq, idx) => (
                           <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                              <button 
                                 onClick={() => {
                                    const newItems = cmsContent.helpCenter.items.filter((_, i) => i !== idx);
                                    setCmsContent({...cmsContent, helpCenter: {...cmsContent.helpCenter, items: newItems}});
                                 }}
                                 className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                 <X size={16} />
                              </button>
                              
                              <div className="space-y-3 pr-6">
                                 <input 
                                    value={faq.question}
                                    onChange={e => {
                                       const newItems = cmsContent.helpCenter.items.map((it, i) => 
                                          i === idx ? { ...it, question: e.target.value } : it
                                       );
                                       setCmsContent({...cmsContent, helpCenter: {...cmsContent.helpCenter, items: newItems}});
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none"
                                    placeholder="Domanda"
                                 />
                                 <textarea 
                                    rows={2}
                                    value={faq.answer}
                                    onChange={e => {
                                       const newItems = cmsContent.helpCenter.items.map((it, i) => 
                                          i === idx ? { ...it, answer: e.target.value } : it
                                       );
                                       setCmsContent({...cmsContent, helpCenter: {...cmsContent.helpCenter, items: newItems}});
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
                                    placeholder="Risposta"
                                 />
                                 <select
                                    value={faq.category}
                                    onChange={e => {
                                       const newItems = cmsContent.helpCenter.items.map((it, i) => 
                                          i === idx ? { ...it, category: e.target.value as any } : it
                                       );
                                       setCmsContent({...cmsContent, helpCenter: {...cmsContent.helpCenter, items: newItems}});
                                    }}
                                    className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none font-medium text-slate-600"
                                 >
                                    <option value="general">Generale</option>
                                    <option value="account">Account</option>
                                    <option value="payments">Pagamenti</option>
                                    <option value="trust">Sicurezza</option>
                                 </select>
                              </div>
                           </div>
                        ))}
                     </div>
                 </div>
              </CmsSection>

              {/* Home CTA */}
              <CmsSection id="home-cta" title="Home: CTA Finale" icon={<Zap size={20} />}>
                 <CmsInput label="Titolo" value={cmsContent.home.cta.title} onChange={(e: any) => updateCmsHome('cta', 'title', e.target.value)} />
                 <CmsInput label="Descrizione" type="textarea" value={cmsContent.home.cta.description} onChange={(e: any) => updateCmsHome('cta', 'description', e.target.value)} />
                 <div className="grid grid-cols-2 gap-6">
                    <CmsInput label="Testo Pulsante Cliente" value={cmsContent.home.cta.buttonClient} onChange={(e: any) => updateCmsHome('cta', 'buttonClient', e.target.value)} />
                    <CmsInput label="Testo Pulsante Pro" value={cmsContent.home.cta.buttonPro} onChange={(e: any) => updateCmsHome('cta', 'buttonPro', e.target.value)} />
                 </div>
              </CmsSection>

              {/* How It Works */}
              <CmsSection id="how-it-works" title="Pagina: Come Funziona" icon={<BookOpen size={20} />}>
                 <CmsInput label="Titolo Pagina" value={cmsContent.howItWorks.header.title} onChange={(e: any) => updateCmsHow('header', 'title', e.target.value)} />
                 <CmsInput label="Sottotitolo Pagina" type="textarea" value={cmsContent.howItWorks.header.subtitle} onChange={(e: any) => updateCmsHow('header', 'subtitle', e.target.value)} />
                 
                 <div className="grid grid-cols-2 gap-6 mt-4">
                    <CmsInput label="Etichetta Tab Cliente" value={cmsContent.howItWorks.tabs.clientLabel} onChange={(e: any) => updateCmsHow('tabs', 'clientLabel', e.target.value)} />
                    <CmsInput label="Etichetta Tab Pro" value={cmsContent.howItWorks.tabs.proLabel} onChange={(e: any) => updateCmsHow('tabs', 'proLabel', e.target.value)} />
                 </div>

                 <div className="mt-8 space-y-8">
                    <div>
                       <h4 className="font-bold text-slate-900 mb-4 border-b pb-2">Step Clienti</h4>
                       {cmsContent.howItWorks.clientSteps.map((step, idx) => (
                          <div key={idx} className="mb-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                             <div className="space-y-3">
                                <input value={step.title} onChange={e => {
                                   const newSteps = [...cmsContent.howItWorks.clientSteps];
                                   newSteps[idx].title = e.target.value;
                                   setCmsContent(prev => ({...prev, howItWorks: {...prev.howItWorks, clientSteps: newSteps}}));
                                }} className="w-full p-2 bg-white border border-slate-200 rounded text-sm font-bold" />
                                <textarea value={step.description} onChange={e => {
                                   const newSteps = [...cmsContent.howItWorks.clientSteps];
                                   newSteps[idx].description = e.target.value;
                                   setCmsContent(prev => ({...prev, howItWorks: {...prev.howItWorks, clientSteps: newSteps}}));
                                }} className="w-full p-2 bg-white border border-slate-200 rounded text-sm" rows={2} />
                             </div>
                          </div>
                       ))}
                    </div>
                    <div>
                       <h4 className="font-bold text-slate-900 mb-4 border-b pb-2">Step Professionisti</h4>
                       {cmsContent.howItWorks.proSteps.map((step, idx) => (
                          <div key={idx} className="mb-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                             <div className="space-y-3">
                                <input value={step.title} onChange={e => {
                                   const newSteps = [...cmsContent.howItWorks.proSteps];
                                   newSteps[idx].title = e.target.value;
                                   setCmsContent(prev => ({...prev, howItWorks: {...prev.howItWorks, proSteps: newSteps}}));
                                }} className="w-full p-2 bg-white border border-slate-200 rounded text-sm font-bold" />
                                <textarea value={step.description} onChange={e => {
                                   const newSteps = [...cmsContent.howItWorks.proSteps];
                                   newSteps[idx].description = e.target.value;
                                   setCmsContent(prev => ({...prev, howItWorks: {...prev.howItWorks, proSteps: newSteps}}));
                                }} className="w-full p-2 bg-white border border-slate-200 rounded text-sm" rows={2} />
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </CmsSection>

               {/* Footer Section */}
               <CmsSection id="footer" title="Footer" icon={<Layout size={20} />}>
                 <CmsInput 
                    label="Testo 'Chi siamo'" 
                    type="textarea"
                    value={cmsContent.footer.aboutText} 
                    onChange={(e: any) => setCmsContent({...cmsContent, footer: {...cmsContent.footer, aboutText: e.target.value}})} 
                 />
                 <CmsInput 
                    label="Link Legali (Separati da virgola)" 
                    value={cmsContent.footer.legalLinks.join(', ')} 
                    onChange={(e: any) => setCmsContent({...cmsContent, footer: {...cmsContent.footer, legalLinks: e.target.value.split(',').map((s: string) => s.trim())}})} 
                 />
              </CmsSection>
           </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-slate-900 text-white rounded-[24px] overflow-hidden p-8 font-mono text-xs animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-indigo-400">System Logs</h3>
               <button onClick={refreshData} className="text-slate-400 hover:text-white">REFRESH</button>
             </div>
             <div className="space-y-2 h-96 overflow-y-auto custom-scrollbar">
                {logs.map(l => (
                   <div key={l.id} className="flex space-x-4 border-b border-white/10 pb-2">
                      <span className="text-slate-500 w-24 shrink-0">{new Date(l.timestamp).toLocaleTimeString()}</span>
                      <span className="text-indigo-400 w-32 shrink-0">{l.action}</span>
                      <span className="text-slate-300">{l.metadata ? JSON.stringify(l.metadata) : '-'}</span>
                   </div>
                ))}
             </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
