import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateOTPEmailHTML } from '@/lib/email-templates';
import { createAdminClient } from '@/app/utils/supabase/admin';

// Initialize Supabase Admin client for server-side operations
const supabaseAdmin = createAdminClient();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }

    console.log('Resending OTP for email:', email);

    // Validate that the user exists and get their details
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.error('User not found in database:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log('User found, generating new OTP...');

    // Generate a new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    console.log('Generated OTP:', otp, 'Expires at:', expiresAt);

    // Delete any existing OTPs for this email to prevent conflicts
    const { error: deleteError } = await supabaseAdmin
      .from('email_otp')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.warn('Failed to delete existing OTPs:', deleteError);
    }

    // Store the new OTP in database
    const { error: insertError } = await supabaseAdmin
      .from('email_otp')
      .insert([
        {
          email: email,
          otp_code: otp,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        }
      ]);

    if (insertError) {
      console.error('Failed to store OTP:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to generate verification code' 
      }, { status: 500 });
    }

    console.log('OTP stored successfully, sending email...');

    // Send the OTP via email using Resend
    try {
      const emailHtml = generateOTPEmailHTML({
        otpCode: otp,
        userEmail: email,
        appName: "The International Will Registry",
        companyName: "The International Will Registry"
      });
      
      const emailResponse = await resend.emails.send({
        from: 'noreply@theinternationalwillregistry.com',
        to: email,
        subject: 'Your Login Verification Code - Where\'s The Will',
        html: emailHtml,
      });

      console.log('Email sent successfully:', emailResponse);

      return NextResponse.json({ 
        success: true, 
        message: 'Verification code sent successfully' 
      });

    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      
      // Clean up the stored OTP if email failed
      await supabaseAdmin
        .from('email_otp')
        .delete()
        .eq('email', email)
        .eq('otp_code', otp);

      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send verification email' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
