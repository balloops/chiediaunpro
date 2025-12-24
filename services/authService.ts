
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>) {
    // 1. Create Auth User with metadata
    // We pass data in 'options' so it is stored in auth.users raw_user_meta_data as well
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
        offered_services: userData.offeredServices,
        skills: userData.skills || [],
        credits: userData.role === 'PROFESSIONAL' ? 5 : 0, // Free credits for pros
        plan: 'FREE'
      }
    ]);

    if (profileError) {
        console.error('Error creating profile:', profileError);
        // If profile creation fails but auth user exists, we might want to cleanup or warn
        // For this demo, we assume Supabase triggers or manual cleanup if needed.
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

    // Fetch profile details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) {
       // Fallback: if profile is missing but user is logged in (rare sync issue), return basic info from metadata
       const meta = session.user.user_metadata;
       return {
         id: session.user.id,
         email: session.user.email || '',
         name: meta.name || 'Utente',
         role: meta.role as UserRole || UserRole.CLIENT,
         brandName: meta.brand_name
       };
    }

    // Map to our User type
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as UserRole,
      avatar: profile.avatar,
      brandName: profile.brand_name,
      location: profile.location,
      bio: profile.bio,
      credits: profile.credits,
      plan: profile.plan,
      isVerified: profile.is_verified,
      offeredServices: profile.offered_services,
      skills: profile.skills,
      vatNumber: profile.vat_number
    };
  }
};
