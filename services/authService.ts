import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>) {
    // 1. Passiamo TUTTI i dati utente nei metadati di Supabase Auth.
    // Il Trigger SQL 'handle_new_user' (definito in SQL_SETUP.sql) leggerà questi dati
    // e creerà automaticamente la riga nella tabella 'profiles'.
    // Questo aggira qualsiasi problema di permessi/RLS lato frontend.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
          brand_name: userData.brandName,
          location: userData.location,
          bio: userData.bio,
          vat_number: userData.vatNumber,
          phone_number: userData.phoneNumber,
          offered_services: userData.offeredServices,
          // Flag per il trigger
          is_manual_registration: true 
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registrazione fallita');

    // Nota: Non facciamo più l'insert manuale in 'profiles' qui.
    // Se ne occupa il Trigger SQL per garantire che i dati vengano salvati 
    // anche se la sessione non è ancora attiva (es. email confirmation pending).

    return authData.user;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Fetch profile details from DB
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Get metadata from session (fallback utile per UI reattiva subito dopo il login)
    const meta = session.user.user_metadata || {};

    // Se il profilo DB non esiste o c'è errore, usiamo i metadati come fallback
    // Questo evita che l'app crashi se il trigger ha avuto un ritardo
    if (error || !profile) {
       console.warn("Profile fetch failed (using metadata fallback):", error?.message);
       return {
         id: session.user.id,
         email: session.user.email || '',
         name: meta.name || 'Utente',
         role: meta.role as UserRole || UserRole.CLIENT,
         brandName: meta.brand_name,
         location: meta.location,
         bio: meta.bio,
         phoneNumber: meta.phone_number,
         credits: 0,
         plan: 'FREE'
       };
    }

    // Uniamo i dati DB con i metadati per massima sicurezza
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name || meta.name,
      role: profile.role as UserRole,
      avatar: profile.avatar,
      brandName: profile.brand_name || meta.brand_name,
      location: profile.location || meta.location,
      bio: profile.bio || meta.bio,
      phoneNumber: profile.phone_number || meta.phone_number,
      credits: profile.credits,
      plan: profile.plan,
      isVerified: profile.is_verified,
      offeredServices: profile.offered_services,
      skills: profile.skills,
      vatNumber: profile.vat_number
    };
  },

  async updateUserPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }
};