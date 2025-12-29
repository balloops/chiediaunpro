
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole, Notification, SiteContent } from '../types';
import { LayoutDashboard, LogOut, User as UserIcon, Bell, Check, Clock } from 'lucide-react';
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
  const [content, setContent] = useState<SiteContent>(contentService.getContent());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isBackend = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  useEffect(() => {
    // Fetch latest content on mount and route change (in case admin updated it)
    contentService.fetchContent().then(setContent);
  }, [location]);

  useEffect(() => {
    if (!user) return;

    // 1. Initial Load
    const loadNotifs = async () => {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    };
    loadNotifs();

    // 2. Realtime Subscription
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
          // Map snake_case from DB to camelCase for UI
          const newNotif = {
              ...payload.new,
              userId: payload.new.user_id,
              isRead: payload.new.is_read,
              createdAt: payload.new.created_at
          } as Notification;
          
          // Prepend new notification and limit to 8 locally
          setNotifications(prev => [newNotif, ...prev].slice(0, 8));
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn("⚠️ Errore connessione Realtime: Verifica di aver abilitato la Replication sulla tabella 'notifications' su Supabase.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await notificationService.markAsRead(id);
  };

  const handleNotificationClick = async (notification: Notification) => {
    await handleMarkAsRead(notification.id);
    setShowNotifDropdown(false);
    
    if (notification.metadata) {
      navigate('/dashboard', { 
        state: { 
          fromNotification: true,
          ...notification.metadata
        } 
      });
    } else if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (user) {
      // Optimistic update
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

  // Determine logo destination based on context
  const logoLink = isBackend 
    ? (user?.role === UserRole.ADMIN ? '/admin' : '/dashboard') 
    : '/';

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4">
      <div className={`${isBackend ? 'w-full' : 'max-w-[1250px] mx-auto'} flex items-center justify-between`}>
        <Link to={logoLink} className="flex items-center space-x-2">
          {content.branding.logoUrl ? (
             <img src={content.branding.logoUrl} alt="Logo" className="h-10 w-auto object-contain rounded-lg" />
          ) : (
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <LayoutDashboard size={24} />
            </div>
          )}
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
            {content.branding.platformName}
          </span>
        </Link>

        {/* Hide central menu items if in backend (Dashboard/Admin) */}
        {!isBackend && (
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Home</Link>
            <Link to="/how-it-works" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Come funziona</Link>
            {user?.role === UserRole.PROFESSIONAL && (
              <Link to="/dashboard" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Le mie offerte</Link>
            )}
          </div>
        )}

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-6">
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className={`p-2 rounded-xl transition-all relative ${showNotifDropdown ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white animate-in zoom-in duration-300">
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
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
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
                    <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                      <Link to="/dashboard" onClick={() => setShowNotifDropdown(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                        Vai alla Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 border-l pl-6 border-slate-200">
                <Link to={isBackend ? '#' : '/dashboard'} className="flex items-center space-x-2 group">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all overflow-hidden border border-slate-200">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{getInitials(user.brandName || user.name)}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 hidden sm:inline">{user.name}</span>
                </Link>
                <button 
                  onClick={onLogout}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
                Accedi
              </Link>
              <Link to="/register" className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                Inizia ora
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
