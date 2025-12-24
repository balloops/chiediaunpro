
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sign in via Supabase
      const authUser = await authService.signIn(email, password);
      
      // Fetch full profile
      const userProfile = await authService.getCurrentUser();
      
      if (userProfile) {
        onLogin(userProfile);
        navigate('/dashboard');
      } else {
        setError('Errore nel caricamento del profilo.');
      }
    } catch (err: any) {
      setError(err.message || 'Credenziali non valide.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-xl p-10 border border-slate-100">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Bentornato!</h2>
            <p className="text-slate-500">Accedi al tuo account.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 flex items-center space-x-3 border border-red-100">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute top-3.5 left-4 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-12 pr-4 rounded-2xl focus:border-indigo-500 outline-none"
                  placeholder="nome@email.it"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute top-3.5 left-4 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-12 pr-4 rounded-2xl focus:border-indigo-500 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi ora'}
              {!isLoading && <ArrowRight className="ml-2" size={18} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-slate-500 text-sm">Non hai ancora un account?</span>{' '}
            <Link to="/register" className="text-indigo-600 font-bold text-sm hover:underline">Registrati</Link>
          </div>
      </div>
    </div>
  );
};

export default LoginView;
