import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

interface CreateRepresentativeUserRequest {
  email: string;
  firstname: string;
  lastname: string;
  middlename?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Server: Starting representative user creation (auth-less)...');
    
    const body: CreateRepresentativeUserRequest = await request.json();
    const { email, firstname, lastname, middlename } = body;

    // Validate required fields
    if (!email || !firstname || !lastname) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client
    const supabase = await createClient();

    console.log('🔄 Server: Creating user record without auth...');

    // Create user record in users table without auth account
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        firstname,
        lastname,
        middlename,
        username: `${firstname.toLowerCase()}_${lastname.toLowerCase()}_${Date.now()}`,
        role: 'user', // Special role indicating auth setup needed
        auth_uid: null, // Will be set when they accept invitation and create their account
      })
      .select('id')
      .single();

    if (userError || !userData) {
      console.error('❌ Server: User creation failed:', userError);
      return NextResponse.json(
        { success: false, error: `User creation error: ${userError?.message || 'Failed to create user record'}` },
        { status: 500 }
      );
    }

    console.log('✅ Server: User record created:', userData.id);

    return NextResponse.json({
      success: true,
      userId: userData.id,
      authId: undefined // No auth account created yet
    });

  } catch (error) {
    console.error('❌ Server: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
