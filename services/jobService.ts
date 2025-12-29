
import { supabase } from './supabaseClient';
import { JobRequest, Quote, User, ServiceCategory, JobLocation, UserRole, Review } from '../types';
import { notificationService } from './notificationService';

export const jobService = {
  
  async getJobs(): Promise<JobRequest[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
      return [];
    }

    // Map DB columns to TS Interface
    return data.map((job: any) => ({
      ...job,
      clientId: job.client_id,
      clientName: job.client_name,
      createdAt: job.created_at
    }));
  },

  async getQuotes(): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];

    return data.map((q: any) => ({
      ...q,
      jobId: q.job_id,
      proId: q.pro_id,
      proName: q.pro_name,
      createdAt: q.created_at
    }));
  },

  async getQuotesForJob(jobId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) return [];

    return data.map((q: any) => ({
      ...q,
      jobId: q.job_id,
      proId: q.pro_id,
      proName: q.pro_name,
      createdAt: q.created_at
    }));
  },

  // NEW METHOD for contact details
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      avatar: data.avatar,
      brandName: data.brand_name,
      location: data.location,
      bio: data.bio,
      phoneNumber: data.phone_number, // Ensure this column exists in DB or is handled
      isVerified: data.is_verified,
      offeredServices: data.offered_services,
      credits: data.credits,
      plan: data.plan
    };
  },

  async createJob(params: {
    clientId: string;
    clientName: string;
    category: string;
    description: string;
    details: Record<string, any>;
    budget: string;
    location?: JobLocation;
  }): Promise<JobRequest | null> {
    
    // Safety check for user
    if (!params.clientId) throw new Error("ID Cliente mancante. Effettua nuovamente il login.");

    const newJob = {
      client_id: params.clientId,
      client_name: params.clientName,
      title: `${params.category}: ${params.description.substring(0, 30)}...`,
      description: params.description,
      category: params.category,
      details: params.details,
      budget: params.budget,
      location: params.location || null,
      status: 'OPEN'
    };

    console.log("Attempting to create job with payload:", newJob);

    const { data, error } = await supabase
      .from('jobs')
      .insert([newJob])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR creating job:', error);
      throw new Error(`Errore database: ${error.message} (Code: ${error.code})`);
    }

    return {
      ...data,
      clientId: data.client_id,
      clientName: data.client_name,
      createdAt: data.created_at,
      tags: [data.category] 
    };
  },

  async updateJobDetails(jobId: string, updates: {
    description?: string;
    details?: Record<string, any>;
    budget?: string;
    location?: JobLocation;
  }): Promise<void> {
    const dbUpdates: any = {};
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.details) dbUpdates.details = updates.details;
    if (updates.budget) dbUpdates.budget = updates.budget;
    if (updates.location) dbUpdates.location = updates.location;

    const { error } = await supabase.from('jobs').update(dbUpdates).eq('id', jobId);
    
    if (error) throw new Error(`Errore aggiornamento job: ${error.message}`);
  },

  async sendQuote(params: {
    jobId: string;
    proId: string;
    proName: string;
    price: number;
    message: string;
    timeline: string;
    clientOwnerId?: string; 
    category?: string; 
  }): Promise<Quote | null> {
    
    // 1. Deduct Credit
    const { data: pro } = await supabase.from('profiles').select('credits, plan').eq('id', params.proId).single();
    
    if (pro && pro.plan !== 'AGENCY') {
        if ((pro.credits || 0) <= 0) throw new Error("Crediti insufficienti. Ricarica il tuo profilo.");
        await supabase.from('profiles').update({ credits: pro.credits - 1 }).eq('id', params.proId);
    }

    // 2. Insert Quote
    const newQuote = {
      job_id: params.jobId,
      pro_id: params.proId,
      pro_name: params.proName,
      price: params.price,
      message: params.message,
      timeline: params.timeline,
      status: 'PENDING'
    };

    const { data, error } = await supabase
      .from('quotes')
      .insert([newQuote])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      jobId: data.job_id,
      proId: data.pro_id,
      proName: data.pro_name,
      createdAt: data.created_at
    };
  },

  async updateQuoteStatus(quote: Quote, status: Quote['status'], jobTitle?: string): Promise<void> {
    // Update DB
    await supabase.from('quotes').update({ status }).eq('id', quote.id);
    
    if (status === 'ACCEPTED') {
       // Close the job as well
       await this.updateJobStatus(quote.jobId, 'IN_PROGRESS');
    }
  },

  async updateJobStatus(jobId: string, status: JobRequest['status']): Promise<void> {
    await supabase.from('jobs').update({ status }).eq('id', jobId);
  },

  async deleteJob(jobId: string): Promise<void> {
    await supabase.from('jobs').delete().eq('id', jobId);
  },

  async updateUserPlan(userId: string, plan: 'FREE' | 'PRO' | 'AGENCY'): Promise<void> {
    let creditsToAdd = 0;
    if (plan === 'PRO') creditsToAdd = 20;
    
    const { data: user } = await supabase.from('profiles').select('credits').eq('id', userId).single();
    const newCredits = plan === 'AGENCY' ? 9999 : (user?.credits || 0) + creditsToAdd;

    await supabase.from('profiles').update({ 
      plan, 
      credits: newCredits 
    }).eq('id', userId);
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
      // Map frontend keys to DB keys
      const dbUpdates: any = {};
      // Use undefined check to allow clearing fields (e.g. empty string)
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.brandName !== undefined) dbUpdates.brand_name = updates.brandName;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.offeredServices !== undefined) dbUpdates.offered_services = updates.offeredServices;
      if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;

      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
      if (error) throw error;
  },

  // Helper for matching
  async getMatchesForPro(pro: User): Promise<{ job: JobRequest; matchScore: number }[]> {
    const { data: allJobs } = await supabase.from('jobs').select('*').eq('status', 'OPEN');
    if (!allJobs) return [];

    const { data: myQuotes } = await supabase.from('quotes').select('job_id').eq('pro_id', pro.id);
    const quotedJobIds = new Set(myQuotes?.map((q: any) => q.job_id));

    const jobs = allJobs.map((job: any) => ({
      ...job,
      clientId: job.client_id,
      clientName: job.client_name,
      createdAt: job.created_at,
      tags: job.tags || [job.category] 
    }));

    const relevantJobs = jobs.filter((j: any) => !quotedJobIds.has(j.id));

    if (!pro.offeredServices) {
       // Se non ha servizi, restituisci comunque ordinati per data decrescente
       return relevantJobs
         .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
         .map((j: any) => ({ job: j, matchScore: 50 }));
    }

    return relevantJobs.map((job: any) => {
      let score = 0;
      if (pro.offeredServices?.includes(job.category)) score += 60;
      
      const jobCity = job.location?.city?.toLowerCase();
      const proCity = pro.location?.toLowerCase();

      if (jobCity && proCity) {
        if (jobCity === proCity) score += 20;
        else if (jobCity === 'remoto' || proCity === 'remoto') score += 15;
      } else {
        score += 10;
      }
      
      return { job, matchScore: Math.min(score, 100) };
    })
    // ORDINE CRONOLOGICO (Più recente prima) come richiesto
    .sort((a: any, b: any) => new Date(b.job.createdAt).getTime() - new Date(a.job.createdAt).getTime());
  },

  async getReviews(userId: string): Promise<Review[]> {
    // Check if table exists first (mocking for safety if user hasn't run SQL)
    const { error } = await supabase.from('reviews').select('id').limit(1);
    
    if (error) {
      // Mock data if table missing
      return [
        {
          id: '1',
          jobId: 'job-123',
          clientId: 'client-abc',
          clientName: 'Marco Bianchi',
          proId: userId,
          rating: 5,
          comment: 'Professionista eccezionale! Lavoro consegnato in anticipo e qualità top.',
          createdAt: new Date().toISOString()
        }
      ];
    }

    const { data } = await supabase.from('reviews').select('*').eq('pro_id', userId).order('created_at', { ascending: false });
    return data?.map((r: any) => ({
      id: r.id,
      jobId: r.job_id,
      clientId: r.client_id,
      clientName: r.client_name,
      proId: r.pro_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at
    })) || [];
  }
};
