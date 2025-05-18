import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables:',
    {
      urlExists: !!supabaseUrl,
      anonKeyExists: !!supabaseAnonKey
    }
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 