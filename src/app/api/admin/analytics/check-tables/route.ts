import { createAdminClient } from '@/app/utils/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin Supabase client with service role key
const adminClient = createAdminClient();

// List of tables to check
const tablesToCheck = [
  'users',
  'user_subscription',
  'document_locations',
  'user_emergency_contacts',
  'user_authorized_representatives',
  'user_logins',
  'recent_activities',
  'payment_transactions'
];

/**
 * Helper function to check if a table exists
 */
async function checkTableExists(tableName: string) {
  try {
    const { data, error, count } = await adminClient
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(0);
    
    return {
      tableName,
      exists: !error,
      count: count || 0,
      error: error ? error.message : null
    };
  } catch (err) {
    return {
      tableName,
      exists: false,
      count: 0,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    
    // Extract token
    const token = authHeader.split('Bearer ')[1].trim();
    
    // Verify the token and check for admin role
    const { data: userData, error } = await adminClient.auth.getUser(token);
    
    if (error || !userData) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    
    // Fetch user role
    const { data: userRole, error: roleError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();
      
    if (roleError || !userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check all tables
    const results = await Promise.all(tablesToCheck.map(checkTableExists));
    
    // Group results by existence
    const existingTables = results.filter(r => r.exists);
    const missingTables = results.filter(r => !r.exists);
    
    return NextResponse.json({
      allTablesExist: missingTables.length === 0,
      existingTables,
      missingTables,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    });
  } catch (error) {
    console.error('Error checking tables:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
