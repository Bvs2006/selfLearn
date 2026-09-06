import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zmlbijflvrukttlrfhlo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptbGJpamZsdnJ1a3R0bHJmaGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzODg1NzEsImV4cCI6MjEwMDk2NDU3MX0.YXMDV-vgBL37ZDCitUBqxVcv5uR-1HFCV7FP-kInbA0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
