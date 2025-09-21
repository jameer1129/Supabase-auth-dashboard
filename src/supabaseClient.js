// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://agqovujbdthwbmxabozp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncW92dWpiZHRod2JteGFib3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDA0NzAsImV4cCI6MjA3Mzc3NjQ3MH0.YI36V7nh4yK7rWqZFG4Kc7_19yblXAIIM8ZQ_TOgUAE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
