
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

export const adminService = {
  async getStats() {
    // Users count via Supabase count queries for efficiency
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: proCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'PROFESSIONAL');
    const { count: clientCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CLIENT');
    
    // Jobs count
    const { count: totalJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
    
    // Quotes count & stats
    const { data: quotes } = await supabase.from('quotes').select('status');
    const totalQuotes = quotes?.length || 0;
    
    // Derived stats
    const avgQuotes = totalJobs && totalQuotes ? (totalQuotes / totalJobs).toFixed(1) : '0';
    const acceptedQuotes = quotes?.filter(q => q.status === 'ACCEPTED').length || 0;
    const successRate = totalJobs ? Math.round((acceptedQuotes / totalJobs) * 100) : 0;

    return {
      totalUsers: totalUsers || 0,
      proCount: proCount || 0,
      clientCount: clientCount || 0,
      totalJobs: totalJobs || 0,
      totalQuotes,
      avgQuotes,
      successRate
    };
  },

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map((p: any) => ({
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role as UserRole,
      avatar: p.avatar,
      brandName: p.brand_name,
      location: p.location,
      bio: p.bio,
      credits: p.credits,
      plan: p.plan,
      isVerified: p.is_verified,
      offeredServices: p.offered_services,
      skills: p.skills,
      vatNumber: p.vat_number,
      createdAt: p.created_at
    }));
  },

  async deleteUser(userId: string): Promise<void> {
    // Nota: questo elimina solo il profilo pubblico. 
    // L'utente Auth rimarrà su Supabase a meno che non si usi una Cloud Function, 
    // ma per questa demo è sufficiente rimuovere il profilo.
    await supabase.from('profiles').delete().eq('id', userId);
  },

  async deleteJob(jobId: string): Promise<void> {
    await supabase.from('jobs').delete().eq('id', jobId);
  },

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    await supabase.from('profiles').update({ role }).eq('id', userId);
  },
  
  async toggleUserVerification(userId: string, isVerified: boolean): Promise<void> {
    await supabase.from('profiles').update({ is_verified: isVerified }).eq('id', userId);
  }
};
