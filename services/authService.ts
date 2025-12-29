import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>) {
    // 1. Registrazione su Supabase Auth con Metadati Completi
    // Passiamo tutti i campi custom dentro 'options.data'.
    // Il Trigger SQL 'handle_new_user' userà questi dati per popolare la tabella 'profiles'.
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
          offered_services: userData.offeredServices, // Passiamo l'array
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registrazione fallita');

    // NON facciamo più l'insert manuale qui.
    // Ci affidiamo al 100% al Trigger SQL che è molto più affidabile e veloce.

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

    // Tentativo di recupero profilo dal DB
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Recupero metadati dalla sessione come fallback immediato
    const meta = session.user.user_metadata || {};

    // Se il profilo DB non è ancora pronto (questione di millisecondi per il trigger),
    // usiamo i metadati della sessione per non bloccare l'utente.
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: profile?.name || meta.name || 'Utente',
      role: (profile?.role || meta.role || UserRole.CLIENT) as UserRole,
      avatar: profile?.avatar || meta.avatar,
      brandName: profile?.brand_name || meta.brand_name,
      location: profile?.location || meta.location,
      bio: profile?.bio || meta.bio,
      phoneNumber: profile?.phone_number || meta.phone_number,
      credits: profile?.credits ?? (meta.role === 'PROFESSIONAL' ? 3 : 0),
      plan: profile?.plan || 'FREE',
      isVerified: profile?.is_verified || false,
      offeredServices: profile?.offered_services || meta.offered_services || [],
      skills: profile?.skills || [],
      vatNumber: profile?.vat_number || meta.vat_number
    };
  },

  async updateUserPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }
};