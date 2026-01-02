
import { supabase } from './supabaseClient';
import { JobRequest, Quote, User, UserRole } from '../types';

export const jobService = {
  async createJob(jobData: Partial<JobRequest>): Promise<JobRequest> {
    const newJob = {
      client_id: jobData.clientId,
      client_name: jobData.clientName,
      title: jobData.category, // Using category as title for now as per UI
      description: jobData.description,
      category: jobData.category,
      details: jobData.details,
      budget: jobData.budget,
      location: jobData.location,
      status: 'OPEN',
      tags: [],
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert([newJob])
      .select()
      .single();

    if (error) throw error;
    
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
      tags: data.tags,
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
      tags: j.tags,
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
  },

  async updateQuoteStatus(quote: Quote, status: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', quote.id);

    if (error) throw error;
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
    
    // Filter active jobs
    const activeJobs = allJobs.filter(j => j.status === 'OPEN' || j.status === 'IN_PROGRESS');

    const matches = activeJobs.map(job => {
        let score = 0;
        // Category match
        if (user.offeredServices?.includes(job.category)) {
            score += 60;
        } else {
            return { job, matchScore: 0 };
        }

        // Location match (simple string check)
        if (user.location && job.location?.city) {
             if (job.location.city.toLowerCase().includes(user.location.toLowerCase()) || 
                 user.location.toLowerCase().includes(job.location.city.toLowerCase()) ||
                 job.location.city.toLowerCase() === 'remoto') {
                 score += 30;
             }
        }

        // Basic score just for existing
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
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.brandName) dbUpdates.brand_name = updates.brandName;
    if (updates.location) dbUpdates.location = updates.location;
    if (updates.bio) dbUpdates.bio = updates.bio;
    if (updates.phoneNumber) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.offeredServices) dbUpdates.offered_services = updates.offeredServices;

    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    if (error) throw error;

    // Sync Auth Metadata
    const metaUpdates: any = {};
    if (updates.name) metaUpdates.name = updates.name;
    if (updates.brandName) metaUpdates.brand_name = updates.brandName;
    if (updates.location) metaUpdates.location = updates.location;
    if (updates.bio) metaUpdates.bio = updates.bio;
    if (updates.phoneNumber) metaUpdates.phone_number = updates.phoneNumber;
    if (updates.offeredServices !== undefined) metaUpdates.offered_services = updates.offeredServices;
    
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

  // NEW METHOD: Refill credits up to 30 for free (Launch Version)
  async refillCredits(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ credits: 30 })
      .eq('id', userId);
    
    if (error) throw error;
  }
};
