import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';

interface CreateRepresentativeAuthRequest {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  middlename?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Server: Starting representative auth creation...');
    
    const body: CreateRepresentativeAuthRequest = await request.json();
    const { email, password, firstname, lastname, middlename } = body;

    // Validate required fields
    if (!email || !password || !firstname || !lastname) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Server: Missing required environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create admin Supabase client (this won't affect client sessions)
    const supabase = createAdminClient();

    console.log('🔄 Server: Creating auth account...');
    
    // Create auth account using server-side client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstname,
        last_name: lastname,
        middle_name: middlename,
        role: 'representative'
      }
    });

    if (authError || !authData.user) {
      console.error('❌ Server: Auth creation failed:', authError);
      return NextResponse.json(
        { success: false, error: `Authentication error: ${authError?.message || 'Failed to create auth user'}` },
        { status: 500 }
      );
    }

    console.log('✅ Server: Auth account created:', authData.user.id);

    // Create user record in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        firstname,
        lastname,
        middlename,
        username: `${firstname.toLowerCase()}_${lastname.toLowerCase()}_${Date.now()}`,
        role: 'user', // Normal role for active representatives
        auth_uid: authData.user.id,
      })
      .select('id')
      .single();

    if (userError || !userData) {
      console.error('❌ Server: User creation failed:', userError);
      // Try to clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: `User creation error: ${userError?.message || 'Failed to create user record'}` },
        { status: 500 }
      );
    }

    console.log('✅ Server: User record created:', userData.id);

    return NextResponse.json({
      success: true,
      userId: userData.id,
      authId: authData.user.id
    });

  } catch (error) {
    console.error('❌ Server: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
