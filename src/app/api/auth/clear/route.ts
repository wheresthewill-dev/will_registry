import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Clear all auth cookies and session data
 * Useful for testing or when auth state gets stuck
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies
    const allCookies = cookieStore.getAll();
    
    // Delete all Supabase auth cookies
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.delete(cookie.name);
      }
    });
    
    // Also delete payment cookies if any
    cookieStore.delete('payment_token');
    cookieStore.delete('payment_payer_id');
    
    return NextResponse.json({ 
      success: true, 
      message: 'All auth cookies cleared',
      clearedCookies: allCookies.filter(c => c.name.startsWith('sb-')).length
    });
  } catch (error) {
    console.error('Error clearing cookies:', error);
    return NextResponse.json(
      { error: 'Failed to clear cookies' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to clear auth data'
  }, { status: 405 });
}
