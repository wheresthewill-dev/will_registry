/**
 * Get User by Auth ID API Route
 * Retrieves user database record using auth UUID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByAuthId } from '@/app/utils/userUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authId = searchParams.get('auth_id');

    if (!authId) {
      return NextResponse.json(
        { error: 'Missing auth_id parameter' },
        { status: 400 }
      );
    }

    const user = await getUserByAuthId(authId);

    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('❌ Get user by auth ID failed:', error);
    
    if (error instanceof Error && error.message.includes('User not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get user',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authId } = body;

    if (!authId) {
      return NextResponse.json(
        { error: 'Missing authId in request body' },
        { status: 400 }
      );
    }

    const user = await getUserByAuthId(authId);

    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('❌ Get user by auth ID failed:', error);
    
    if (error instanceof Error && error.message.includes('User not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get user',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}
