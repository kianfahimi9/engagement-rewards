/**
 * Supabase Client Configuration
 * Uses service role key for backend operations with full database access
 * Lazy initialization to support both build-time and runtime environments
 */

import { createClient } from '@supabase/supabase-js';

let _supabaseClient = null;

/**
 * Get or create Supabase client instance
 * Lazy initialization ensures env vars are available at runtime
 */
function getSupabaseClient() {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  _supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return _supabaseClient;
}

// Export a proxy that creates the client on first use
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop];
  }
});
