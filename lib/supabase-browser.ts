import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
function isValidSupabaseConfig(url?: string, key?: string): boolean {
  return !!(
    url && 
    key && 
    url.startsWith('http') && 
    !url.includes('your_supabase_project_url_here') &&
    !key.includes('your_supabase_anon_key_here') &&
    key.length > 20
  );
}

// Singleton client instance
let clientInstance: any = null;

// Create a mock client for when Supabase is not configured
function createMockClient() {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null }, 
        error: { message: 'Supabase not configured' } 
      }),
      onAuthStateChange: () => ({ 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      eq: function() { return this; },
      gte: function() { return this; },
    })
  } as any;
}

// Create a function that returns a Supabase client for browser usage
export function createClient() {
  // Return cached instance if available
  if (clientInstance) {
    return clientInstance;
  }

  if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
    console.warn('Supabase not configured properly. Using mock client.');
    clientInstance = createMockClient();
    return clientInstance;
  }

  try {
    clientInstance = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
    return clientInstance;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    clientInstance = createMockClient();
    return clientInstance;
  }
}

// Export a default client instance for backward compatibility
export const supabase = createClient();
