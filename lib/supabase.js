/**
 * Supabase Client Configuration
 * Uses service role key for backend operations with full database access
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// During build time, env vars might not be available - use dummy values
// At runtime, the actual values will be used
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseServiceKey || 'placeholder-key-for-build';

// Create Supabase client with service role for backend operations
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
