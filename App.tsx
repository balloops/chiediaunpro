
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, AuthState } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './views/LandingPage';
import Dashboard from './views/Dashboard';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import PublicPostJobView from './views/PublicPostJobView';
import AdminDashboard from './views/AdminDashboard';
import HowItWorksView from './views/HowItWorksView';
import HelpView from './views/HelpView';
import GDPRBanner from './components/GDPRBanner';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // 1. Check active session on startup
    const checkSession = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setAuth({ user, isAuthenticated: true, isLoading: false });
        } else {
          setAuth({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch (error) {
        console.error("Session check failed", error);
        setAuth({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    checkSession();

    // 2. Listen for auth changes (Login, Logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const user = await authService.getCurrentUser();
        setAuth({ user, isAuthenticated: true, isLoading: false });
      } else if (event === 'SIGNED_OUT') {
        setAuth({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
