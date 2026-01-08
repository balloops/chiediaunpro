import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, AuthState } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './src/views/LandingPage';
import VerticalLandingView from './src/views/VerticalLandingView'; // Importata nuova view
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
import { RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
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

    const loadingTimeout = setTimeout(() => {
      if (mounted && auth.isLoading) {
        setShowReload(true);
      }
    }, 5000); 

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
        clearTimeout(loadingTimeout);
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
      clearTimeout(loadingTimeout);
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
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col space-y-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Caricamento LavoraBene...</p>
        
        {showReload && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <p className="text-xs text-red-400 mb-3 font-medium">Ci sta mettendo più del previsto...</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-bold shadow-sm hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center mx-auto"
            >
              <RefreshCw size={14} className="mr-2" />
              Ricarica Pagina
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