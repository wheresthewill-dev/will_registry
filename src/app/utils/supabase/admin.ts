import { createClient } from '@supabase/supabase-js';

// This utility provides a Supabase client with the service role key for admin operations
// IMPORTANT: This should ONLY be used in server-side contexts (API routes, Server Actions)
// Never expose this client to the client-side as it has full database access

export const createAdminClient = () => {
  // Ensure we're in a server context
  if (typeof window !== 'undefined') {
    console.error('Admin client should not be used in client-side code!');
    throw new Error('Admin client should not be used in client-side code');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables for admin client');
  }

  // Create a Supabase client with the service role key
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false, // No need to persist admin sessions
      autoRefreshToken: false,
    }
  });
};
