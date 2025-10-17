import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';

// Create a Supabase client with service role key to bypass RLS
const supabaseAdmin = createAdminClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Query users table by email using service role (bypasses RLS)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, firstname, lastname, middlename, auth_uid, role')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No user found
        return NextResponse.json(
          { user: null, found: false },
          { status: 200 }
        );
      }
      
      console.error('Error querying user by email:', error);
      return NextResponse.json(
        { error: 'Failed to query user' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { user, found: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('API Error in /api/users/by-email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
