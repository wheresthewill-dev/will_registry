/**
 * User Database Utilities
 * Shared functions for user database operations
 */

import { createAdminClient } from './supabase/admin';

const supabaseAdmin = createAdminClient();

export interface User {
  id: number;
  authId: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get user database record by auth UUID
 * @param authId - The auth UUID from Supabase Auth
 * @returns User database record with integer ID
 */
export async function getUserByAuthId(authId: string): Promise<User> {
  if (!authId) {
    throw new Error('Auth ID is required');
  }

  console.log(`🔍 Looking up user by auth ID: ${authId}`);

  // Get user from database using auth UUID
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('auth_uid', authId)
    .single();

  if (userError) {
    console.error('User lookup error:', userError);
    
    if (userError.code === 'PGRST116') {
      throw new Error(`User not found: ${authId}`);
    }
    
    throw new Error(`Database error: ${userError.message}`);
  }

  if (!userData) {
    throw new Error(`User not found: ${authId}`);
  }

  console.log(`✅ User found: DB ID ${userData.id} for auth ID ${authId}`);

  return {
    id: userData.id,
    authId: authId,
    email: userData.email,
  };
}
