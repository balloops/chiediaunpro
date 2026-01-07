import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';
import { authService } from '../../services/authService';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset Password States
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setResetSuccess(false);

    try {
        await authService.resetPasswordForEmail(email);
        setResetSuccess(true);
    } catch (err: any) {
        console.error("Reset error:", err);
        setError(err.message || "Errore nell'invio della richiesta di reset.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-xl p-10 border border-slate-100">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
                {isResetMode ? 'Recupera Password' : 'Bentornato!'}
            </h2>
            <p className="text-slate-500">
                {isResetMode 
                    ? 'Inserisci la tua email per ricevere il link di ripristino.' 
                    : 'Accedi al tuo account.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 flex items-center space-x-3 border border-red-100 animate-in fade-in">
              <AlertCircle size={20} className="shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {resetSuccess && isResetMode ? (
             <div className="text-center animate-in fade-in zoom-in-95 bg-green-50 p-6 rounded-3xl border border-green-100">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">Email Inviata!</h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    Se l'indirizzo <strong>{email}</strong> è registrato, riceverai un link per reimpostare la password.
                </p>
                <div className="flex items-start space-x-2 text-left bg-white p-3 rounded-xl border border-green-100 mb-6">
                    <HelpCircle size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-500">
                        <strong>Non la trovi?</strong> Controlla la cartella <em>Spam</em> o <em>Promozioni</em>. Potrebbe impiegare qualche minuto.
                    </p>
                </div>
                <button 
                    onClick={() => { setIsResetMode(false); setResetSuccess(false); setError(''); }}
                    className="text-indigo-600 font-bold hover:underline text-sm"
                >
                    Torna al login
                </button>
             </div>
          ) : (
            <form onSubmit={isResetMode ? handleResetPassword : handleSubmit} className="space-y-6 animate-in fade-in">
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

                {!isResetMode && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-bold text-slate-700">Password</label>
                            <button 
                                type="button" 
                                onClick={() => { setIsResetMode(true); setError(''); }}
                                className="text-xs font-bold text-indigo-600 hover:underline"
                            >
                                Password dimenticata?
                            </button>
                        </div>
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
                )}

                <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-70"
                >
                {isLoading 
                    ? 'Elaborazione...' 
                    : (isResetMode ? 'Invia link di reset' : 'Accedi ora')}
                {!isLoading && !isResetMode && <ArrowRight className="ml-2" size={18} />}
                </button>

                {isResetMode && (
                    <div className="text-center pt-2">
                        <button 
                            type="button" 
                            onClick={() => { setIsResetMode(false); setError(''); }}
                            className="text-slate-500 text-sm font-bold hover:text-slate-700"
                        >
                            Annulla e torna al login
                        </button>
                    </div>
                )}
            </form>
          )}

          {!isResetMode && (
            <div className="mt-8 text-center">
                <span className="text-slate-500 text-sm">Non hai ancora un account?</span>{' '}
                <Link to="/register" className="text-indigo-600 font-bold text-sm hover:underline">Registrati</Link>
            </div>
          )}
      </div>
    </div>
  );
};

export default LoginView;