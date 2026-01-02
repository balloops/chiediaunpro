
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>) {
    // 1. Preparazione Dati Puliti
    // Generiamo uno username semplice alfanumerico per evitare errori
    const namePart = (userData.name || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 10);
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    const uniqueUsername = `${namePart}${randomPart}`; 
    const userRole = (userData.role || 'CLIENT') as UserRole;

    // Metadati minimi essenziali per il trigger SQL
    const metaData = {
      name: userData.name || 'Utente',
      full_name: userData.name || 'Utente',
      role: userRole,
      username: uniqueUsername,
    };

    // 2. Chiamata a Supabase Auth
    // Ora che abbiamo corretto l'SQL, questa chiamata non dovrebbe più fallire
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metaData
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Registrazione completata ma utente nullo.');

    // 3. Salvataggio Dettagli Aggiuntivi (Upsert)
    // Anche se il trigger crea il profilo base, aggiorniamo subito con i dati opzionali (bio, telefono, ecc.)
    // Usiamo 'upsert' così funziona sia se il trigger ha creato il profilo, sia se ha fallito silenziosamente.
    try {
        const profileUpdates = {
            id: data.user.id,
            email: email,
            updated_at: new Date().toISOString(),
            // Campi base (sovrascriviamo per sicurezza)
            name: userData.name || 'Utente',
            role: userRole,
            username: uniqueUsername,
            // Campi opzionali
            ...(userData.brandName && { brand_name: userData.brandName }),
            ...(userData.location && { location: userData.location }),
            ...(userData.bio && { bio: userData.bio }),
            ...(userData.phoneNumber && { phone_number: userData.phoneNumber }),
            ...(userData.vatNumber && { vat_number: userData.vatNumber }),
            ...(userData.offeredServices && { offered_services: userData.offeredServices }),
            // Crediti iniziali per i PRO
            ...(userRole === 'PROFESSIONAL' ? { credits: 30 } : {})
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileUpdates)
            .select();

        if (profileError) {
            console.warn("Avviso: Aggiornamento dettagli profilo:", profileError.message);
        }
    } catch (e) {
        console.warn("Errore non critico nel salvataggio dettagli extra:", e);
    }

    return data.user;
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

    // Recupero dati dal DB
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Fallback sui metadati se il profilo DB non è ancora pronto (es. ritardo trigger)
    const meta = session.user.user_metadata || {};

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: profile?.name || meta.name || 'Utente',
      role: (profile?.role || meta.role || UserRole.CLIENT) as UserRole,
      avatar: profile?.avatar || meta.avatar_url,
      brandName: profile?.brand_name,
      location: profile?.location,
      bio: profile?.bio,
      phoneNumber: profile?.phone_number,
      credits: profile?.credits ?? (meta.role === 'PROFESSIONAL' ? 30 : 0),
      plan: profile?.plan || 'FREE',
      isVerified: profile?.is_verified || false,
      offeredServices: profile?.offered_services || [],
      skills: profile?.skills || [],
      vatNumber: profile?.vat_number
    };
  },

  async updateUserPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }
};
