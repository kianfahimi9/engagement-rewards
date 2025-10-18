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
  // Prefer service role key for full backend access, fallback to anon key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Need NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Log warning if using anon key instead of service role
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️  Using ANON key instead of SERVICE_ROLE key. Some backend operations may be restricted.');
  }

  _supabaseClient = createClient(supabaseUrl, supabaseKey, {
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
