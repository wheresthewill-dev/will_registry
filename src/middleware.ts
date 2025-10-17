import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();
  
  // Create server-side Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    // Check authentication state
    const { data: { session } } = await supabase.auth.getSession();

    // Get the pathname
    const { pathname } = request.nextUrl;

    // Define public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/register', '/verify-otp', '/expired-link', '/unauthorized', 
      '/contact-us', '/faqs', '/help-center', '/how-it-works', '/security'];
    
    // Define special routes that have special handling (like payment return URLs)
    const specialRoutes = ['/dashboard/subscription/success', '/dashboard/subscription/cancel'];
    
    // Define dashboard routes that are accessible to everyone
    const publicDashboardRoutes: string[] = [];
    
    // Check if the route is a public route
    const isPublicRoute = pathname === '/' || publicRoutes.some(route => 
      route !== '/' && pathname.startsWith(route)
    );
    
    // Check if the route is a special route
    const isSpecialRoute = specialRoutes.some(route => pathname.startsWith(route));
    
    // Check if the route is a public dashboard route
    const isPublicDashboardRoute = publicDashboardRoutes.some(route => pathname.startsWith(route));
    
    // Allow API routes to be handled by their own auth
    if (pathname.startsWith('/api/')) {
      return response;
    }
    
    // Special handling for payment return URLs
    if (isSpecialRoute) {
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      
      // Store important payment parameters in cookies
      if (searchParams.has('token')) {
        response.cookies.set('payment_token', searchParams.get('token')!, {
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 60 * 10, // 10 minutes
          path: '/',
        });
      }
      
      if (searchParams.has('PayerID')) {
        response.cookies.set('payment_payer_id', searchParams.get('PayerID')!, {
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 60 * 10, // 10 minutes
          path: '/',
        });
      }
      
      // If no session but we have payment params, allow access
      if (!session && (searchParams.has('token') || searchParams.has('PayerID'))) {
        return response;
      }
    }

    // If not logged in and trying to access a protected route, redirect to login
    if (!session && !isPublicRoute && !isPublicDashboardRoute) {
      console.log(`🚫 Middleware: No session, redirecting ${pathname} to login`);
      
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectUrl', pathname);
      
      return NextResponse.redirect(redirectUrl);
    }

    // If logged in and trying to access auth-only pages, redirect to dashboard
    const authOnlyRoutes = ['/login', '/register', '/verify-otp'];
    const isAuthOnlyRoute = authOnlyRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
    
    if (session && isAuthOnlyRoute) {
      console.log(`🔄 Middleware: Redirecting authenticated user from ${pathname} to dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If user is authenticated, fetch their profile and add to headers
    if (session?.user) {
      try {
        const { data: profile } = await supabase
          .from("users")
          .select("id, firstname, lastname, username, email, role")
          .eq("email", session.user.email)
          .single();

        if (profile) {
          // Store user data in headers for global access
          response.headers.set('x-user-id', profile.id);
          response.headers.set('x-user-email', profile.email);
          response.headers.set('x-user-firstname', profile.firstname || '');
          response.headers.set('x-user-lastname', profile.lastname || '');
          response.headers.set('x-user-role', profile.role || 'user');
          response.headers.set('x-is-admin', (profile.role === 'admin' || profile.role === 'super_admin').toString());
          response.headers.set('x-is-super-admin', (profile.role === 'super_admin').toString());
        }
      } catch (profileError) {
        console.log('Middleware: Profile fetch failed:', profileError);
      }
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // If there's an error with authentication, redirect to login
    if (error instanceof Error && 
        (error.message.includes('auth') || error.message.includes('session') || error.message.includes('token'))) {
      
      // Get the pathname
      const { pathname } = request.nextUrl;
      
      // Define public routes that don't require authentication
      const publicRoutes = ['/', '/login', '/register', '/verify-otp', '/expired-link', '/unauthorized', 
        '/contact-us', '/faqs', '/help-center', '/how-it-works', '/security'];
      
      // Check if the route is a public route
      const isPublicRoute = pathname === '/' || publicRoutes.some(route => 
        route !== '/' && pathname.startsWith(route)
      );
      
      // Only redirect non-public routes
      if (!isPublicRoute && !pathname.startsWith('/api/')) {
        // Store the original URL for redirection after login
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectUrl', pathname);
        
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // For all other errors, just continue
    return NextResponse.next();
  }
}

// Specify which routes this middleware applies to
export const config = {
  matcher: [
    // Apply to all routes except static files and api routes that handle their own auth
    '/((?!_next/static|_next/image|favicon.ico|images|assets).*)',
  ],
};
