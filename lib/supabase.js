/**
 * Supabase Client Configuration
 * Centralized client using the same credentials as the rest of the app
 */

import { createClient } from '@supabase/supabase-js';

let _supabaseClient = null;

/**
 * Get or create Supabase client instance
 * Lazy initialization to prevent build-time errors
 */
function getSupabaseClient() {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required');
  }

  _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return _supabaseClient;
}

// Export a proxy that creates the client on first use
// This prevents errors during build when env vars might not be available
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop];
  }
});
