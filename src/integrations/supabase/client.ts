import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://foyqibzibonfvqunqwnu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveXFpYnppYm9uZnZxdW5xd251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTEzMTYsImV4cCI6MjA3Mjc4NzMxNn0.LZXgX86qv-N17lNclgDO-hcvFNuQ1Szdv1AwNfDpdBE';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});