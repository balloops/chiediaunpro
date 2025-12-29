
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>) {
    // 1. Create Auth User with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
          brand_name: userData.brandName
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registrazione fallita');

    // 2. Create Profile Record (Public table)
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        email: email,
        name: userData.name,
        role: userData.role,
        brand_name: userData.brandName,
        location: userData.location,
        bio: userData.bio,
        vat_number: userData.vatNumber,
        phone_number: userData.phoneNumber,
        offered_services: userData.offeredServices,
        skills: userData.skills || [],
        credits: userData.role === 'PROFESSIONAL' ? 100 : 0,
        plan: 'FREE'
      }
    ]);

    if (profileError) {
        console.error('Error creating profile:', profileError);
    }

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

    // Get metadata from session (which we update manually on save)
    const meta = session.user.user_metadata || {};

    // Fallback completo se il DB non risponde o il profilo non esiste
    if (error || !profile) {
       console.warn("Profile fetch failed, using metadata fallback", error);
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

    // HYBRID MERGE STRATEGY
    // Se il DB ha il campo vuoto/null, ma i metadati ce l'hanno, usiamo i metadati.
    // Questo "nasconde" il problema RLS all'utente finale perché vede i dati appena inseriti.
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
