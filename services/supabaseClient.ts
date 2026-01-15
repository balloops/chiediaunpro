
import { createClient } from '@supabase/supabase-js';

// CONFIGURAZIONE FINALE PER PRODUZIONE (Vercel / GitHub)
// Gestione sicura delle variabili d'ambiente per evitare crash "process is not defined" in Vite

const getEnvVar = (key: string, fallback: string): string => {
  // 1. Prova import.meta.env (Standard Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // 2. Prova process.env in modo sicuro (senza far crashare se process non esiste)
  if (typeof process !== 'undefined' && process.env && process.env[key.replace('VITE_', 'REACT_APP_')]) {
    return process.env[key.replace('VITE_', 'REACT_APP_')] as string;
  }
  return fallback;
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://yodhavnbqenbdcirnlbq.supabase.co'); 
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZGhhdm5icWVuYmRjaXJubGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Nzc3MTcsImV4cCI6MjA4MjE1MzcxN30.woihB9veMHu7b9QDkcKjgPT-xGX-pIE-73_RTPvZm4I');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
