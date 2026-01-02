
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>) {
    // 1. Preparazione Dati Puliti (Sanitization)
    // Passiamo solo i dati ESSENZIALI al trigger di Supabase per evitare errori SQL
    // (es. "Database error saving new user" causato da campi mancanti o tipi errati nel trigger)
    const initialMetaData = {
      name: userData.name,
      role: userData.role || 'CLIENT',
    };

    // 2. Registrazione Auth con Metadati Minimi
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: initialMetaData
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registrazione fallita: Utente non creato.');

    // 3. Salvataggio Completo Profilo (Backup Frontend)
    // Ora che l'utente è creato (e il trigger base è passato), salviamo tutti i dettagli
    // direttamente nella tabella profiles. Questo bypassa le limitazioni del trigger.
    try {
        const fullProfile = {
            id: authData.user.id,
            email: email,
            name: userData.name,
            role: userData.role || 'CLIENT',
            brand_name: userData.brandName ?? null,
            location: userData.location ?? null,
            bio: userData.bio ?? null,
            phone_number: userData.phoneNumber ?? null,
            vat_number: userData.vatNumber ?? null,
            offered_services: userData.offeredServices ?? [], 
            credits: userData.role === 'PROFESSIONAL' ? 30 : 0,
            plan: 'FREE',
            is_verified: false,
            updated_at: new Date().toISOString()
        };

        // Usiamo upsert per garantire che se il trigger ha creato una riga parziale, noi la aggiorniamo
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(fullProfile)
            .select();

        if (profileError) {
            console.warn("Info salvataggio profilo (non bloccante):", profileError.message);
        }

        // 4. Sincronizziamo i metadati Auth completi (opzionale, per coerenza sessione)
        await supabase.auth.updateUser({
            data: {
                brand_name: userData.brandName ?? null,
                location: userData.location ?? null,
                phone_number: userData.phoneNumber ?? null,
                // Aggiungere altri campi se necessario in sessione
            }
        });

    } catch (e) {
        console.warn("Errore non critico nel salvataggio dettagli profilo:", e);
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

    // Recupero metadati dalla sessione (Fallback immediato)
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
