import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * API endpoint to get current user data
 * This is called ONCE by the global user store and cached
 * Checks Supabase auth first, then uses middleware headers as fallback
 * NO auth subscriptions, NO multiple profile fetches
 */
export async function GET(request: NextRequest) {
  try {
    // First, check Supabase auth session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: () => {}, // Read-only in API routes
          remove: () => {}, // Read-only in API routes
        },
      }
    );

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.log('[/api/auth/me] No valid session');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Try to get user data from middleware headers first (fastest)
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const userEmail = headersList.get('x-user-email');
    const userFirstname = headersList.get('x-user-firstname');
    const userLastname = headersList.get('x-user-lastname');
    const userRole = headersList.get('x-user-role');
    const isAdmin = headersList.get('x-is-admin') === 'true';
    const isSuperAdmin = headersList.get('x-is-super-admin') === 'true';

    // If headers are populated (from middleware), use them
    if (userId && userEmail) {
      const user = {
        id: userId,
        email: userEmail,
        firstname: userFirstname || '',
        lastname: userLastname || '',
        name: `${userFirstname || ''} ${userLastname || ''}`.trim() || userEmail,
        role: userRole || 'user',
        isAdmin,
        isSuperAdmin,
      };

      console.log('[/api/auth/me] Returning user from middleware headers:', userEmail);
      return NextResponse.json(user);
    }

    // Fallback: Fetch profile from database if headers not available
    console.log('[/api/auth/me] Headers not available, fetching profile from database');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, firstname, lastname, username, email, role')
      .eq('email', session.user.email)
      .single();

    if (profileError || !profile) {
      console.error('[/api/auth/me] Failed to fetch profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    const user = {
      id: profile.id,
      email: profile.email,
      firstname: profile.firstname || '',
      lastname: profile.lastname || '',
      name: `${profile.firstname || ''} ${profile.lastname || ''}`.trim() || profile.email,
      role: profile.role || 'user',
      isAdmin: profile.role === 'admin' || profile.role === 'super_admin',
      isSuperAdmin: profile.role === 'super_admin',
    };

    console.log('[/api/auth/me] Returning user from database:', user.email);
    return NextResponse.json(user);
  } catch (error) {
    console.error('[/api/auth/me] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}