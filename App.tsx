import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, AuthState } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './src/views/LandingPage';
import Dashboard from './src/views/Dashboard';
import LoginView from './src/views/LoginView';
import RegisterView from './src/views/RegisterView';
import PublicPostJobView from './src/views/PublicPostJobView';
import AdminDashboard from './src/views/AdminDashboard';
import HowItWorksView from './src/views/HowItWorksView';
import HelpView from './src/views/HelpView';
import GDPRBanner from './components/GDPRBanner';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';
import { contentService } from './services/contentService';
import { RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [showReload, setShowReload] = useState(false);

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

    // Check preliminare per capire se siamo in un flusso di recovery password
    // Se c'è un hash con type=recovery o access_token, potremmo essere in fase di login da link email
    const isRecoveryFlow = window.location.hash && (
        window.location.hash.includes('type=recovery') || 
        window.location.hash.includes('access_token')
    );

    // Safety timeout to prevent infinite loading screen visualization
    const loadingTimeout = setTimeout(() => {
      if (mounted && auth.isLoading) {
        setShowReload(true);
      }
    }, 5000); // Show reload option after 5 seconds

    const initializeAuth = async () => {
      // 1. Setup Listener FIRST to catch events immediately
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        console.log("Auth Event:", event);

        if (event === 'PASSWORD_RECOVERY') {
            // Evento specifico: Utente ha cliccato sul link di reset
            const user = await authService.getCurrentUser();
            setAuth({ user, isAuthenticated: true, isLoading: false });
            
            // Forziamo il redirect alla dashboard settings con mode recovery
            // Usiamo window.location.hash perché siamo fuori dal Router context in questo punto
            window.location.hash = '/dashboard?tab=settings&mode=recovery';
        }
        else if (event === 'SIGNED_IN' && session) {
           // Se siamo in recovery flow, potremmo voler aspettare l'evento PASSWORD_RECOVERY
           // Ma se siamo già loggati, procediamo.
           const user = await authService.getCurrentUser();
           
           // Se l'hash contiene ancora token sporchi di supabase, puliamoli verso dashboard recovery se necessario
           if (window.location.hash.includes('type=recovery')) {
               window.location.hash = '/dashboard?tab=settings&mode=recovery';
           }
           
           setAuth({ user, isAuthenticated: true, isLoading: false });
        } else if (event === 'SIGNED_OUT') {
           setAuth({ user: null, isAuthenticated: false, isLoading: false });
        }
      });
      authListener = data.subscription;

      // 2. Initial Session Check
      try {
        const user = await authService.getCurrentUser();
        
        // Se NON siamo in un flusso di recovery (o se abbiamo già l'utente), aggiorniamo lo stato.
        // Se siamo in recovery e user è null, aspettiamo l'evento onAuthStateChange.
        if (mounted) {
            if (!isRecoveryFlow || user) {
                setAuth({
                    user,
                    isAuthenticated: !!user,
                    isLoading: false
                });
            }
            // Se isRecoveryFlow è true e user è null, lasciamo isLoading a true finché Supabase non processa l'hash
        }
      } catch (error) {
        console.error("Session check failed", error);
        if (mounted) {
          setAuth({ user: null, isAuthenticated: false, isLoading: false });
        }
      } finally {
        clearTimeout(loadingTimeout);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      if (authListener) authListener.unsubscribe();
    };
  }, []); // Run once

  const handleLogout = async () => {
    await authService.signOut();
    // State update handled by onAuthStateChange
  };

  // Callback to force update state manually if needed (mostly for registration flow redirection)
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