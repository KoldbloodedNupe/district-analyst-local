
import { createClient } from '@supabase/supabase-js';

// District Analyst Scout - Supabase Credentials
const supabaseUrl = 'https://kpmdkfltumvurkfxpujg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbWRrZmx0dW12dXJrZnhwdWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjcyNjQsImV4cCI6MjA4NTkwMzI2NH0.bwdLSkt5z6oix5lhgCHQDwexH-nu_X7Ad0aglnwtTiA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
