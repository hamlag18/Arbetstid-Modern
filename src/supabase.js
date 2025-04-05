import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://emtdulhgnltleehgixsy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGR1bGhnbmx0bGVlaGdpeHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NzYyMjgsImV4cCI6MjA1OTM1MjIyOH0.Pb7t56YrMoHBJIVa9lmYZSDDKenem7s6BavYjaSDutI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase; 