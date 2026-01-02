
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>) {
    // 1. Preparazione Dati minimi
    // Non passiamo troppi metadati complessi a Supabase Auth per evitare che il trigger SQL si rompa elaborandoli.
    // Ci fidiamo del fatto che aggiorneremo tutto nello step 3.
    const userRole = (userData.role || 'CLIENT') as UserRole;
    
    // Metadati essenziali per il trigger (fallback)
    const metaData = {
      name: userData.name || 'Utente',
      role: userRole,
    };

    // 2. Chiamata a Supabase Auth
    // Ora il trigger SQL è "blindato" (ignora errori), quindi questo step dovrebbe sempre passare.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metaData
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Registrazione completata ma utente nullo. Verifica la conferma email.');

    // 3. Update Profilo (Strategia "Smart Frontend")
    // Indipendentemente da cosa ha fatto il trigger SQL (ha messo default? ha fallito silenziosamente?),
    // noi sovrascriviamo il profilo con i dati corretti e completi qui.
    try {
        const profileUpdates = {
            id: data.user.id,
            email: email,
            updated_at: new Date().toISOString(),
            // Dati Anagrafici
            name: userData.name || 'Utente',
            role: userRole,
            // Dati Opzionali
            ...(userData.brandName && { brand_name: userData.brandName }),
            ...(userData.location && { location: userData.location }),
            ...(userData.bio && { bio: userData.bio }),
            ...(userData.phoneNumber && { phone_number: userData.phoneNumber }),
            ...(userData.vatNumber && { vat_number: userData.vatNumber }),
            ...(userData.offeredServices && { offered_services: userData.offeredServices }),
            // Logica Crediti: Se è un PRO, diamogli i 30 crediti di benvenuto qui
            ...(userRole === 'PROFESSIONAL' ? { credits: 30 } : {})
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileUpdates, { onConflict: 'id' }) 
            .select();

        if (profileError) {
            console.error("Errore salvataggio dettagli profilo:", profileError.message);
            // Non lanciamo errore qui per non bloccare l'utente in un limbo (registrato ma errore frontend)
        }
    } catch (e) {
        console.warn("Errore non critico post-registrazione:", e);
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

    // Fallback sui metadati se il profilo DB non risponde
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
