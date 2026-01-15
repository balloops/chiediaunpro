
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole, Notification, SiteContent } from '../types';
import { 
  LayoutDashboard, LogOut, User as UserIcon, Bell, Check, Clock, Menu, X, 
  Star, FileText, Send, Trophy, Archive, Settings, Coins, Users, Briefcase, 
  BarChart3, Layers, CreditCard, Globe, Terminal, ChevronDown, HelpCircle
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { contentService } from '../services/contentService';
import { supabase } from '../services/supabaseClient';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [content, setContent] = useState<SiteContent>(contentService.getContent());
  
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  const isBackend = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');
  const isAdmin = user?.role === UserRole.ADMIN;
  const isPro = user?.role === UserRole.PROFESSIONAL;

  useEffect(() => {
    contentService.fetchContent().then(setContent);
    setIsMobileMenuOpen(false); // Close menu on route change
  }, [location]);

  useEffect(() => {
    if (!user) return;

    const loadNotifs = async () => {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    };
    loadNotifs();

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = {
              ...payload.new,
              userId: payload.new.user_id,
              isRead: payload.new.is_read,
              createdAt: payload.new.created_at
          } as Notification;
          
          setNotifications(prev => [newNotif, ...prev].slice(0, 8));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close Notification Dropdown
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      // Close Profile Dropdown
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await notificationService.markAsRead(id);
  };

  const handleNotificationClick = async (notification: Notification) => {
    await handleMarkAsRead(notification.id);
    setShowNotifDropdown(false);
    if (notification.link) {
      navigate(notification.link);
    } else {
      navigate('/dashboard');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (user) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await notificationService.markAllAsRead(user.id);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // --- NAVIGATION CONFIG ---
  const getDashboardLinks = () => {
    const links = [];
    if (isPro) {
      links.push({ to: '/dashboard?tab=leads', label: 'Opportunità', icon: <Star size={18} /> });
      links.push({ to: '/dashboard?tab=quotes', label: 'Proposte Inviate', icon: <Send size={18} /> });
      links.push({ to: '/dashboard?tab=won', label: 'Lavori accettati', icon: <Trophy size={18} /> });
      links.push({ to: '/dashboard?tab=billing', label: 'Crediti', icon: <Coins size={18} /> });
    } else {
      links.push({ to: '/dashboard?tab=my-requests', label: 'Le mie Richieste', icon: <FileText size={18} /> });
      links.push({ to: '/dashboard?tab=archived', label: 'Archiviate', icon: <Archive size={18} /> });
    }
    // Common
    links.push({ to: '/dashboard?tab=settings', label: 'Profilo', icon: <Settings size={18} /> });
    return links;
  };

  const getAdminLinks = () => [
    { to: '/admin?tab=overview', label: 'Dashboard', icon: <BarChart3 size={18} /> },
    { to: '/admin?tab=users', label: 'Utenti', icon: <Users size={18} /> },
    { to: '/admin?tab=requests', label: 'Richieste', icon: <Briefcase size={18} /> },
    { to: '/admin?tab=categories', label: 'Categorie', icon: <Layers size={18} /> },
    { to: '/admin?tab=plans', label: 'Piani', icon: <CreditCard size={18} /> },
    { to: '/admin?tab=cms', label: 'CMS Sito', icon: <Globe size={18} /> },
    { to: '/admin?tab=logs', label: 'Logs', icon: <Terminal size={18} /> },
  ];

  const getPublicLinks = () => [
    { to: '/', label: 'Home', icon: <LayoutDashboard size={18} /> },
    { to: '/how-it-works', label: 'Come funziona', icon: <FileText size={18} /> },
    { to: '/post-job', label: 'Pubblica Richiesta', icon: <Send size={18} /> },
  ];

  const renderMobileMenuLinks = () => {
    let links = [];
    if (isAdmin && location.pathname.startsWith('/admin')) {
      links = getAdminLinks();
    } else if (user && location.pathname.startsWith('/dashboard')) {
      links = getDashboardLinks();
    } else {
      links = getPublicLinks();
    }

    return (
      <div className="flex flex-col space-y-2 p-4">
        {links.map((link, idx) => (
          <Link
            key={idx}
            to={link.to}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 font-bold transition-colors"
          >
            <div className="text-slate-400">{link.icon}</div>
            <span>{link.label}</span>
          </Link>
        ))}
        {user && (
           <button 
             onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
             className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold transition-colors mt-4 border-t border-slate-100"
           >
             <LogOut size={18} />
             <span>Esci</span>
           </button>
        )}
        {!user && (
           <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-3">
              <Link to="/login" className="w-full py-3 text-center font-bold text-slate-700 bg-slate-50 rounded-xl">Accedi</Link>
              <Link to="/register" className="w-full py-3 text-center font-bold text-white bg-indigo-600 rounded-xl">Registrati</Link>
           </div>
        )}
      </div>
    );
  };

  const logoLink = isBackend 
    ? (user?.role === UserRole.ADMIN ? '/admin?tab=overview' : '/dashboard') 
    : '/';

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-[100] px-4 md:px-6 py-3 md:py-4">
      <div className={`${isBackend ? 'w-full' : 'max-w-[1250px] mx-auto'} flex items-center justify-between`}>
        
        {/* LEFT: Logo */}
        <Link to={logoLink} className="flex items-center z-50 relative">
          {content.branding.logoUrl ? (
             // Logo come immagine completa (es. 212x30)
             <img 
               src={content.branding.logoUrl} 
               alt={content.branding.platformName} 
               className="h-[30px] w-auto object-contain" 
             />
          ) : (
            // Fallback: Icona + Testo
            <div className="flex items-center space-x-2">
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                  <LayoutDashboard size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 truncate max-w-[150px] md:max-w-none">
                  {content.branding.platformName}
                </span>
            </div>
          )}
        </Link>

        {/* CENTER: Desktop Links */}
        {!isBackend && (
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Home</Link>
            <Link to="/how-it-works" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Come funziona</Link>
            {user?.role === UserRole.PROFESSIONAL && (
              <Link to="/dashboard" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Le mie offerte</Link>
            )}
          </div>
        )}

        {/* RIGHT: Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifDropdownRef}>
                <button 
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className={`p-2 rounded-xl transition-all relative ${showNotifDropdown ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white border border-slate-100 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right z-50">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-sm">Notifiche</h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                          Segna tutte come lette
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            className={`p-5 flex items-start space-x-4 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${n.isRead ? 'opacity-60 grayscale-[0.5]' : 'bg-slate-50/50 hover:bg-indigo-50/30'}`}
                          >
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-slate-200' : 'bg-indigo-600 animate-pulse'}`}></div>
                            <div className="flex-grow">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{n.title}</span>
                                <span className="text-[8px] font-bold text-slate-400 flex items-center">
                                  <Clock size={8} className="mr-1" />
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center">
                          <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell size={24} />
                          </div>
                          <p className="text-sm text-slate-400 font-medium">Ancora nessuna notifica</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Icon (Direct link to profile on Mobile) */}
              <Link 
                to="/dashboard?tab=settings"
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all md:hidden"
              >
                <UserIcon size={20} />
              </Link>

              {/* Desktop User Profile Dropdown */}
              <div className="hidden md:flex items-center space-x-3 border-l pl-6 border-slate-200 relative" ref={profileDropdownRef}>
                <button 
                  onClick={() => setShowProfileDropdown((prev) => !prev)}
                  className="flex items-center space-x-2 group outline-none cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all overflow-hidden border border-slate-200">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{getInitials(user.name)}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 hidden sm:inline group-hover:text-indigo-600 transition-colors">
                    {user.name}
                  </span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-4 w-64 bg-white border border-slate-100 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 origin-top-right z-[100]">
                    <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                      <p className="text-sm font-black text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                      <div className="mt-2 inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded-md tracking-wider">
                        {user.role}
                      </div>
                    </div>
                    <div className="p-2">
                      <Link 
                        to={user.role === UserRole.ADMIN ? '/admin?tab=overview' : '/dashboard'} 
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center px-4 py-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      >
                        <LayoutDashboard size={18} className="mr-3" />
                        Dashboard
                      </Link>
                      
                      <Link 
                        to="/dashboard?tab=settings" 
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center px-4 py-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      >
                        <UserIcon size={18} className="mr-3" />
                        Profilo
                      </Link>

                      {user.role === UserRole.PROFESSIONAL && (
                        <Link 
                          to="/dashboard?tab=settings" 
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center px-4 py-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          <Briefcase size={18} className="mr-3" />
                          I miei servizi
                        </Link>
                      )}

                      {user.role === UserRole.PROFESSIONAL && (
                        <Link 
                          to="/dashboard?tab=billing" 
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center px-4 py-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          <Coins size={18} className="mr-3" />
                          Crediti
                        </Link>
                      )}
                      
                      <Link 
                        to="/help" 
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center px-4 py-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      >
                        <HelpCircle size={18} className="mr-3" />
                        Assistenza
                      </Link>

                      <div className="h-px bg-slate-100 my-1"></div>

                      <button 
                        onClick={() => {
                          onLogout();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut size={18} className="mr-3" />
                        Esci
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle - Placed at the end */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          ) : (
            // Public Actions
            <div className="flex items-center space-x-3">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors hidden md:block">
                Accedi
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hidden md:block">
                Inizia ora
              </Link>
              {/* Mobile Menu Toggle for Public */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FULL SCREEN MENU */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-2xl animate-in slide-in-from-top-2 duration-200 md:hidden z-40 max-h-[80vh] overflow-y-auto">
           {renderMobileMenuLinks()}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
