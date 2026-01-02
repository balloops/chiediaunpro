
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>) {
    // 0. PRE-CHECK: Verifica esistenza profilo (Best effort)
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (existingProfile) {
        throw new Error('CONFLICT_PROFILE: Questa email è già associata a un profilo esistente.');
    }

    // 1. Generazione Username ULTRA-SICURA
    // Rimuoviamo qualsiasi carattere speciale e limitiamo la lunghezza.
    // Esempio: "Mario Rossi" -> "mariorossi4821"
    const namePart = (userData.name || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 10);
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    const uniqueUsername = `${namePart}${randomPart}`; // Max 14 chars, solo lettere/numeri

    const userRole = (userData.role || 'CLIENT') as UserRole;

    // 2. Metadati Standardizzati per Trigger
    // Inviamo solo dati essenziali e puliti per evitare errori SQL nel trigger
    const metaData = {
      full_name: userData.name || 'Utente',
      name: userData.name || 'Utente',
      username: uniqueUsername,
      role: userRole,
      email: email
    };

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metaData
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registrazione fallita: Utente non creato.');

    // 3. Fallback Upsert Profilo
    // Eseguiamo upsert per garantire consistenza dati
    try {
        const profileData = {
            id: authData.user.id,
            email: email,
            name: userData.name,
            username: uniqueUsername,
            role: userRole,
            full_name: userData.name,
            avatar_url: userData.avatar || null,
            brand_name: userData.brandName || null,
            location: userData.location || null,
            bio: userData.bio || null,
            phone_number: userData.phoneNumber || null,
            vat_number: userData.vatNumber || null,
            offered_services: userData.offeredServices || [],
            credits: userRole === 'PROFESSIONAL' ? 30 : 0,
            plan: 'FREE',
            is_verified: false,
            updated_at: new Date().toISOString()
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData)
            .select();

        if (profileError) {
            console.warn("Info: Upsert profilo post-auth:", profileError.message);
        }
    } catch (e) {
        console.warn("Errore non critico profilo:", e);
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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const meta = session.user.user_metadata || {};

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: profile?.name || meta.name || meta.full_name || 'Utente',
      role: (profile?.role || meta.role || UserRole.CLIENT) as UserRole,
      avatar: profile?.avatar || meta.avatar || meta.avatar_url,
      brandName: profile?.brand_name || meta.brand_name,
      location: profile?.location || meta.location,
      bio: profile?.bio || meta.bio,
      phoneNumber: profile?.phone_number || meta.phone_number,
      credits: profile?.credits ?? (meta.role === 'PROFESSIONAL' ? 30 : 0),
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
