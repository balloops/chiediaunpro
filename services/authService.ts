import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>) {
    // 1. Preparazione Dati Puliti (Sanitization)
    // Assicuriamo che nessun campo sia 'undefined', ma 'null' o valore di default.
    // Questo è fondamentale per il Trigger SQL e per jsonb.
    const metaData = {
      name: userData.name,
      role: userData.role || 'CLIENT',
      brand_name: userData.brandName ?? null,
      location: userData.location ?? null,
      bio: userData.bio ?? null,
      vat_number: userData.vatNumber ?? null,
      phone_number: userData.phoneNumber ?? null,
      offered_services: userData.offeredServices ?? [], // Array vuoto se null
    };

    // 2. Registrazione Auth con Metadati
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metaData
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registrazione fallita: Utente non creato.');

    // 3. Salvataggio Manuale Profilo (Backup Frontend - Double Safety)
    // Se il Trigger SQL fallisce per qualsiasi motivo, questo blocco tenterà di salvare il profilo.
    try {
        const userProfile = {
            id: authData.user.id,
            email: email,
            name: metaData.name,
            role: metaData.role,
            brand_name: metaData.brand_name,
            location: metaData.location,
            bio: metaData.bio,
            phone_number: metaData.phone_number,
            vat_number: metaData.vat_number,
            offered_services: metaData.offered_services,
            credits: metaData.role === 'PROFESSIONAL' ? 3 : 0,
            plan: 'FREE',
            is_verified: false,
            updated_at: new Date().toISOString()
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(userProfile)
            .select();

        if (profileError) {
            // Logghiamo solo come warning perché è probabile che il trigger abbia già fatto il lavoro
            console.warn("Info salvataggio manuale (normale se il trigger ha funzionato):", profileError.message);
        }
    } catch (e) {
        console.warn("Errore non critico nel salvataggio profilo manuale:", e);
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

    // Tentativo di recupero profilo dal DB
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Recupero metadati dalla sessione (Fallback immediato se il DB è lento o il trigger sta ancora lavorando)
    const meta = session.user.user_metadata || {};

    // Costruiamo l'oggetto utente fondendo DB e Metadati
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