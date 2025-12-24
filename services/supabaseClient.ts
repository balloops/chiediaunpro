
import { createClient } from '@supabase/supabase-js';

// CONFIGURAZIONE FINALE PER PRODUZIONE (Vercel / GitHub)
// Quando andrai su Vercel, imposterai le Environment Variables:
// VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || process.env?.REACT_APP_SUPABASE_URL || 'https://yodhavnbqenbdcirnlbq.supabase.co'; 
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env?.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZGhhdm5icWVuYmRjaXJubGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Nzc3MTcsImV4cCI6MjA4MjE1MzcxN30.woihB9veMHu7b9QDkcKjgPT-xGX-pIE-73_RTPvZm4I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
