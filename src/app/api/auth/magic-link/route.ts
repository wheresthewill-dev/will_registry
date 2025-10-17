import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createAdminClient();

export async function POST(request: NextRequest) {
  try {
    const { email, invitationType, invitedBy } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Generating magic link for email:', email);

    // Generate magic link using service role
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        data: {
          invitation_type: invitationType || 'resend_invitation',
          invited_by: invitedBy || 'system'
        }
      }
    });

    if (error) {
      console.error('❌ Failed to generate magic link:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Magic link generated successfully');
    
    return NextResponse.json({
      success: true,
      magicLinkUrl: data.properties?.action_link,
      message: 'Magic link generated successfully'
    });

  } catch (error) {
    console.error('❌ Magic link API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
