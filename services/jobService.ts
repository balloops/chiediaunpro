import { supabase } from './supabaseClient';
import { JobRequest, Quote, User, UserRole } from '../types';
import { emailService } from './emailService';

export const jobService = {
  async createJob(jobData: Partial<JobRequest>): Promise<JobRequest> {
    const newJob = {
      client_id: jobData.clientId,
      client_name: jobData.clientName,
      title: jobData.category, 
      description: jobData.description,
      category: jobData.category,
      details: jobData.details,
      budget: jobData.budget,
      location: jobData.location,
      status: 'OPEN',
    };

    // Primo tentativo di inserimento
    let { data, error } = await supabase
      .from('jobs')
      .insert([newJob])
      .select()
      .single();

    // AUTO-FIX: Gestione Errore FK (Profilo Mancante - Code 23503)
    if (error && error.code === '23503') { 
        console.warn("Profilo mancante rilevato (FK Error). Tentativo di ripristino profilo e retry...");
        
        if (jobData.clientId) {
            // 1. Tentiamo di creare/aggiornare il profilo al volo
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: jobData.clientId,
                name: jobData.clientName || 'Utente',
                role: 'CLIENT', 
                updated_at: new Date().toISOString()
            });
            
            if (profileError) {
                console.error("Fallito ripristino profilo:", profileError);
            } else {
                console.log("Profilo ripristinato. Riprovo inserimento job...");
            }

            // 2. Riprova inserimento job (Secondo tentativo)
            const retry = await supabase.from('jobs').insert([newJob]).select().single();
            
            if (!retry.error) {
                data = retry.data;
                error = null;
            } else {
                console.error("Fallito anche il secondo tentativo:", retry.error);
                error = retry.error; 
            }
        }
    }

    if (error) {
        if (error.code === '23503') {
            throw new Error("Impossibile salvare la richiesta: il tuo profilo utente non risulta attivo. Assicurati di aver completato la registrazione o prova a fare Logout/Login.");
        }
        throw error;
    }
    
    // NOTIFICA VIA EMAIL AL CLIENTE (Conferma Creazione)
    if (jobData.clientId && data) {
       this.getUserProfile(jobData.clientId).then(user => {
          if (user && user.email) {
             emailService.notifyClientJobPosted(
                user.email,
                user.name,
                jobData.category || 'Tua Richiesta',
                data.id
             ).catch(err => console.warn("Email conferma job fallita:", err));
          }
       });
    }
    
    return {
      id: data.id,
      clientId: data.client_id,
      clientName: data.client_name,
      title: data.title,
      description: data.description,
      category: data.category,
      details: data.details,
      budget: data.budget,
      timeline: data.timeline,
      tags: data.tags || [],
      location: data.location,
      status: data.status,
      createdAt: data.created_at
    };
  },

  async getJobs(): Promise<JobRequest[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((j: any) => ({
      id: j.id,
      clientId: j.client_id,
      clientName: j.client_name,
      title: j.title,
      description: j.description,
      category: j.category,
      details: j.details,
      budget: j.budget,
      timeline: j.timeline,
      tags: j.tags || [],
      location: j.location,
      status: j.status,
      createdAt: j.created_at
    }));
  },

  async getQuotes(): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((q: any) => ({
      id: q.id,
      jobId: q.job_id,
      proId: q.pro_id,
      proName: q.pro_name,
      price: q.price,
      message: q.message,
      timeline: q.timeline,
      status: q.status,
      createdAt: q.created_at
    }));
  },

  async getQuotesForJob(jobId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((q: any) => ({
      id: q.id,
      jobId: q.job_id,
      proId: q.pro_id,
      proName: q.pro_name,
      price: q.price,
      message: q.message,
      timeline: q.timeline,
      status: q.status,
      createdAt: q.created_at
    }));
  },

  async sendQuote(quoteData: any): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .insert([{
        job_id: quoteData.jobId,
        pro_id: quoteData.proId,
        pro_name: quoteData.proName,
        price: quoteData.price,
        message: quoteData.message,
        timeline: quoteData.timeline,
        status: 'PENDING'
      }]);

    if (error) throw error;

    try {
      const client = await this.getUserProfile(quoteData.clientOwnerId);
      if (client && client.email) {
        await emailService.notifyClientNewQuote(
          client.email,
          client.name,
          quoteData.proName,
          quoteData.category,
          quoteData.jobId
        );
      }
    } catch (emailError) {
      console.error("Errore invio email notifica preventivo:", emailError);
    }
  },

  async updateQuoteStatus(quote: Quote, status: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', quote.id);

    if (error) throw error;

    if (status === 'ACCEPTED') {
      try {
        const pro = await this.getUserProfile(quote.proId);
        const { data: jobData } = await supabase.from('jobs').select('title, client_name, category').eq('id', quote.jobId).single();
        
        if (pro && pro.email && jobData) {
          await emailService.notifyProQuoteAccepted(
            pro.email,
            pro.name,
            jobData.client_name, 
            jobData.category, 
            quote.id
          );
        }
      } catch (emailError) {
        console.error("Errore invio email notifica accettazione:", emailError);
      }
    }
  },

  async updateJobDetails(jobId: string, updates: any): Promise<void> {
     const dbUpdates: any = {};
     if (updates.description) dbUpdates.description = updates.description;
     if (updates.budget) dbUpdates.budget = updates.budget;
     if (updates.location) dbUpdates.location = updates.location;

     const { error } = await supabase.from('jobs').update(dbUpdates).eq('id', jobId);
     if (error) throw error;
  },

  async updateJobStatus(jobId: string, status: string): Promise<void> {
    const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId);
    if (error) throw error;
  },

  async deleteJob(jobId: string): Promise<void> {
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) throw error;
  },

  async getMatchesForPro(user: User): Promise<{ job: JobRequest; matchScore: number }[]> {
    const allJobs = await this.getJobs();
    
    const activeJobs = allJobs.filter(j => j.status === 'OPEN' || j.status === 'IN_PROGRESS');

    const matches = activeJobs.map(job => {
        let score = 0;
        if (user.offeredServices?.includes(job.category)) {
            score += 60;
        } else {
            return { job, matchScore: 0 };
        }

        if (user.location && job.location?.city) {
             if (job.location.city.toLowerCase().includes(user.location.toLowerCase()) || 
                 user.location.toLowerCase().includes(job.location.city.toLowerCase()) ||
                 job.location.city.toLowerCase() === 'remoto') {
                 score += 30;
             }
        }

        score += 10;

        return { job, matchScore: score };
    }).filter(m => m.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  },

  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      brandName: data.brand_name,
      location: data.location,
      bio: data.bio,
      phoneNumber: data.phone_number,
      vatNumber: data.vat_number,
      offeredServices: data.offered_services,
      credits: data.credits,
      plan: data.plan,
      isVerified: data.is_verified
    };
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const dbUpdates: any = {
        updated_at: new Date().toISOString()
    };
    
    // Aggiorniamo solo i campi definiti (non undefined)
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.brandName !== undefined) dbUpdates.brand_name = updates.brandName;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.offeredServices !== undefined) dbUpdates.offered_services = updates.offeredServices;

    // USIAMO UPDATE, NON UPSERT. 
    // Il profilo esiste già. Se usiamo Upsert con politiche RLS restrittive potrebbe fallire.
    // L'Update è permesso dalla policy "Users can update own profile".
    const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId);

    if (error) {
        console.error("Errore aggiornamento profilo:", error);
        throw error;
    }

    // Sync auth metadata (opzionale ma utile per performance sessione)
    const metaUpdates: any = {};
    if (updates.name) metaUpdates.name = updates.name;
    if (updates.brandName) metaUpdates.brand_name = updates.brandName;
    
    if (Object.keys(metaUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({ data: metaUpdates });
        if (authError) console.warn("Auth metadata update failed", authError);
    }
  },

  async updateUserPlan(userId: string, plan: string): Promise<void> {
     let credits = 0;
     if (plan === 'PRO') credits = 50;
     if (plan === 'AGENCY') credits = 9999;

     const { error } = await supabase
       .from('profiles')
       .update({ plan, credits })
       .eq('id', userId);
    
    if (error) throw error;
  },

  async refillCredits(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ credits: 30 })
      .eq('id', userId);
    
    if (error) throw error;
  }
};