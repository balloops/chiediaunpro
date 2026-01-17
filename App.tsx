
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, AuthState } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './src/views/LandingPage';
import VerticalLandingView from './src/views/VerticalLandingView'; 
import Dashboard from './src/views/Dashboard';
import LoginView from './src/views/LoginView';
import RegisterView from './src/views/RegisterView';
import PublicPostJobView from './src/views/PublicPostJobView';
import AdminDashboard from './src/views/AdminDashboard';
import HowItWorksView from './src/views/HowItWorksView';
import HelpView from './src/views/HelpView';
import GDPRBanner from './components/GDPRBanner';
import RouteTracker from './components/RouteTracker'; 
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';
import { contentService } from './services/contentService';
import { analyticsService } from './services/analyticsService';
import { RefreshCw, Server, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  // State per gestire UX del Cold Start
  const [loadingMessage, setLoadingMessage] = useState('Caricamento LavoraBene...');
  const [showReload, setShowReload] = useState(false);

  // Init Analytics se il consenso è già presente
  useEffect(() => {
    if (analyticsService.hasConsent()) {
      analyticsService.initialize();
    }
  }, []);

  // Sync Branding Effect (Favicon & Title)
  useEffect(() => {
    const loadBranding = async () => {
      const content = await contentService.fetchContent();
      
      // Update Title
      if (content.branding.platformName) {
        document.title = content.branding.platformName;
      }
      
      // Update Favicon
      if (content.branding.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = content.branding.faviconUrl;
      }
    };
    loadBranding();
  }, []);

  useEffect(() => {
    let mounted = true;
    let authListener: any = null;

    // Timer per gestire i messaggi di "Cold Start" (Database che si sveglia)
    const timer1 = setTimeout(() => {
        if (mounted && auth.isLoading) setLoadingMessage('Avvio dei server sicuri in corso...');
    }, 2500);

    const timer2 = setTimeout(() => {
        if (mounted && auth.isLoading) setLoadingMessage('Ci siamo quasi, stiamo svegliando il database...');
    }, 6000);

    const timer3 = setTimeout(() => {
        if (mounted && auth.isLoading) setShowReload(true);
    }, 10000);

    const initializeAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        
        if (mounted) {
           setAuth({
             user,
             isAuthenticated: !!user,
             isLoading: false
           });
        }
      } catch (error) {
        console.error("Session check failed", error);
        if (mounted) {
          setAuth({ user: null, isAuthenticated: false, isLoading: false });
        }
      } finally {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      }

      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        console.log("Auth Event:", event);

        if (event === 'PASSWORD_RECOVERY') {
            const user = await authService.getCurrentUser();
            setAuth({ user, isAuthenticated: true, isLoading: false });
            window.location.hash = '/dashboard?tab=settings&mode=recovery';
        }
        else if (event === 'SIGNED_IN' && session) {
           const user = await authService.getCurrentUser();
           setAuth({ user, isAuthenticated: true, isLoading: false });
           analyticsService.trackEvent('login', { method: 'email' });
        } else if (event === 'SIGNED_OUT') {
           setAuth({ user: null, isAuthenticated: false, isLoading: false });
        }
      });
      authListener = data.subscription;
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (authListener) authListener.unsubscribe();
    };
  }, []); 

  const handleLogout = async () => {
    await authService.signOut();
  };

  const handleLoginSuccess = (user: User) => {
    setAuth({ user, isAuthenticated: true, isLoading: false });
  };

  const getRedirectPath = () => {
    return auth.user?.role === UserRole.ADMIN ? '/admin' : '/dashboard';
  };

  if (auth.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col space-y-8 p-6 text-center">
        <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Zap size={20} className="text-indigo-600 fill-indigo-600 animate-pulse" />
            </div>
        </div>
        
        <div className="space-y-2 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-slate-600 font-bold text-lg">{loadingMessage}</p>
            {showReload && (
                <p className="text-xs text-slate-400">
                    Il piano gratuito potrebbe richiedere qualche secondo extra per riattivarsi dopo l'inattività.
                </p>
            )}
        </div>
        
        {showReload && (
          <div className="animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl text-sm font-bold shadow-sm hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center mx-auto space-x-2"
            >
              <RefreshCw size={16} />
              <span>Ricarica Pagina</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <RouteTracker /> 
        <Navbar 
          user={auth.user} 
          onLogout={handleLogout} 
        />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage user={auth.user} />} />
            <Route path="/how-it-works" element={<HowItWorksView />} />
            <Route path="/post-job" element={<PublicPostJobView user={auth.user} onLogin={handleLoginSuccess} />} />
            <Route path="/help" element={<HelpView />} />
            
            {/* Nuova Rotta per Landing Verticali */}
            <Route path="/service/:slug" element={<VerticalLandingView />} />

            <Route 
              path="/login" 
              element={!auth.isAuthenticated ? <LoginView onLogin={handleLoginSuccess} /> : <Navigate to={getRedirectPath()} />} 
            />
            <Route 
              path="/register" 
              element={!auth.isAuthenticated ? <RegisterView onLogin={handleLoginSuccess} /> : <Navigate to={getRedirectPath()} />} 
            />
            <Route 
              path="/dashboard/*" 
              element={auth.isAuthenticated ? <Dashboard user={auth.user!} onLogout={handleLogout} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin" 
              element={auth.user?.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
        <GDPRBanner />
      </div>
    </Router>
  );
};

export default App;
