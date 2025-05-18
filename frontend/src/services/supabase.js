import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please make sure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in your environment variables.'
  );
}

// Create Supabase client with session handling configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-' + supabaseUrl.split('//')[1].split('.')[0],
    storage: {
      getItem: (key) => {
        try {
          let value = localStorage.getItem(key);
          if (!value && !key.startsWith('sb-')) {
            value = localStorage.getItem(`sb-${key}`);
          }
          return value;
        } catch (error) {
          console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
          if (!key.startsWith('sb-')) {
            localStorage.setItem(`sb-${key}`, value);
          }
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          if (!key.startsWith('sb-')) {
            localStorage.removeItem(`sb-${key}`);
          }
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    }
  }
});

// Initialize Supabase session from stored data
const initializeSession = async () => {
  try {
    const sessionKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    const existingSession = localStorage.getItem(sessionKey);
    if (existingSession) {
      const { error } = await supabase.auth.initialize();
      if (error) {
        console.error('Failed to initialize session:', error);
        localStorage.removeItem(sessionKey);
      }
    }
  } catch (error) {
    console.error('Error initializing session:', error);
  }
};

initializeSession();

// Helper function to check if Supabase is properly configured and connected
export const checkSupabaseConnection = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) return false;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return false;

    // Try a simple DB query to verify connection
    const { error: dbError } = await supabase.from('users').select('id').limit(1);
    if (dbError) throw dbError;

    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
};

