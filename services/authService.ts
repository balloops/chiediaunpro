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
    try {
        const profileUpdates = {
            id: data.user.id,
            email: email,
            updated_at: new Date().toISOString(),
            name: userData.name || 'Utente',
            role: userRole,
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
            .upsert(profileUpdates, { onConflict: 'id' }) 
            .select();

        if (profileError) {
            console.error("Errore salvataggio dettagli profilo:", profileError.message);
            // Non ingoiamo l'errore se è un problema di permessi, altrimenti l'utente rimane "zombie"
            if (profileError.code === "42501") { // RLS violation
                throw new Error("Permesso negato creazione profilo. Esegui le SQL Policies su Supabase.");
            }
        } else {
            // 4. NOTIFICA ADMIN (Nuovo Utente)
            emailService.notifyAdminNewUser(
                email, 
                userData.name || 'Nuovo Utente', 
                userRole
            ).catch(err => console.warn("Fallito invio mail admin:", err));
        }

    } catch (e: any) {
        console.warn("Errore durante creazione profilo:", e);
        // Rilanciamo l'errore per informare l'UI che qualcosa non va
        throw e;
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
    // Questo risolve l'errore "violates foreign key constraint" se il profilo non era stato creato prima.
    if (!profile && session.user) {
        console.warn("Profilo DB mancante. Tentativo di ripristino automatico...");
        const meta = session.user.user_metadata || {};
        
        const recoveryProfile = {
            id: session.user.id,
            email: session.user.email,
            name: meta.name || 'Utente Recuperato',
            role: meta.role || 'CLIENT',
            updated_at: new Date().toISOString(),
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