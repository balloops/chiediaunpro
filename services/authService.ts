import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';
import { emailService } from './emailService';

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>) {
    // 1. Preparazione Dati minimi
    const userRole = (userData.role || 'CLIENT') as UserRole;
    
    const metaData = {
      name: userData.name || 'Utente',
      role: userRole,
    };

    // 2. Chiamata a Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metaData
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Registrazione completata ma utente nullo.');

    // 3. Update Profilo e Logica Post-Registrazione
    // NOTA: Il trigger 'handle_new_user' ha già creato la riga con ID ed Email.
    // Noi facciamo solo un UPDATE dei campi aggiuntivi.
    try {
        // Attendiamo un istante per essere sicuri che il trigger abbia finito
        await new Promise(r => setTimeout(r, 500));

        const profileUpdates: any = {
            // Rimosso updated_at per evitare errori di cache schema
            // Aggiorniamo solo se i dati sono presenti
            ...(userData.name && { name: userData.name }),
            ...(userData.brandName && { brand_name: userData.brandName }),
            ...(userData.location && { location: userData.location }),
            ...(userData.bio && { bio: userData.bio }),
            ...(userData.phoneNumber && { phone_number: userData.phoneNumber }),
            ...(userData.vatNumber && { vat_number: userData.vatNumber }),
            ...(userData.offeredServices && { offered_services: userData.offeredServices }),
            ...(userRole === 'PROFESSIONAL' ? { credits: 30 } : {})
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', data.user.id);

        if (profileError) {
            console.error("Errore salvataggio dettagli profilo:", profileError.message);
            // Non blocchiamo il flusso, l'utente è registrato, potrà completare il profilo dopo.
        } else {
            // 4. NOTIFICA ADMIN (Nuovo Utente)
            emailService.notifyAdminNewUser(
                email, 
                userData.name || 'Nuovo Utente', 
                userRole
            ).catch(err => console.warn("Fallito invio mail admin:", err));
        }

    } catch (e: any) {
        console.warn("Eccezione durante update profilo:", e);
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

    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // --- AUTO-RIPARAZIONE ---
    // Se l'utente è loggato (Auth) ma non ha un profilo (DB), proviamo a crearlo ora.
    if (!profile && session.user) {
        console.warn("Profilo DB mancante. Tentativo di ripristino automatico...");
        const meta = session.user.user_metadata || {};
        
        const recoveryProfile = {
            id: session.user.id,
            email: session.user.email,
            name: meta.name || 'Utente Recuperato',
            role: meta.role || 'CLIENT',
            // updated_at rimosso per sicurezza
            credits: meta.role === 'PROFESSIONAL' ? 30 : 0
        };
        
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(recoveryProfile)
            .select()
            .single();
            
        if (!createError && newProfile) {
            console.log("Profilo ripristinato con successo.");
            profile = newProfile;
        } else {
            console.error("Impossibile ripristinare profilo:", createError?.message);
        }
    }
    // ------------------------

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