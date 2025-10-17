import { NextResponse, NextRequest } from "next/server";

import { generateOTPEmailHTML } from "@/lib/email-templates";
import { Resend } from 'resend';
import { createAdminClient } from "@/app/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, token, step } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Handle OTP verification step
    if (step === 'verify-otp') {
      if (!token) {
        return NextResponse.json(
          { error: "Verification code is required" },
          { status: 400 }
        );
      }

      console.log('OTP Verification attempt:', {
        email,
        token,
        currentTime: new Date().toISOString(),
        currentTimestamp: Date.now()
      });

      // First, let's check what OTP records exist for debugging
      const { data: debugRecords } = await supabase
        .from('email_otp')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(3);

      console.log('Recent OTP records for', email, ':', debugRecords);

      // Verify custom OTP from database with timezone-safe comparison
      const currentTimeUTC = new Date().toISOString();
      const { data: otpRecord, error: otpError } = await supabase
        .from('email_otp')
        .select('*')
        .eq('email', email)
        .eq('otp_code', token)
        .eq('used', false)
        .gt('expires_at', currentTimeUTC)
        .single();

      console.log('OTP Database query result:', {
        otpRecord,
        otpError,
        currentTimeUTC,
        hasData: !!otpRecord
      });

      if (otpError) {
        console.error('OTP database error:', otpError);
        
        // If no rows returned, provide more specific error
        if (otpError.code === 'PGRST116') {
          return NextResponse.json(
            { error: "Invalid or expired verification code" },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: "Database error during verification" },
          { status: 500 }
        );
      }

      if (!otpRecord) {
        return NextResponse.json(
          { error: "Invalid or expired verification code" },
          { status: 400 }
        );
      }

      // Mark OTP as used
      await supabase
        .from('email_otp')
        .update({ used: true, updated_at: new Date().toISOString() })
        .eq('id', otpRecord.id);

      console.log('OTP marked as used, creating session...');

      // Get the user data first
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      const user = userData?.users.find((u: any) => u.email === email);
      
      if (userError || !user) {
        console.error('User lookup error:', userError);
        return NextResponse.json(
          { error: "User not found" },
          { status: 400 }
        );
      }

      console.log('Found user:', user.id, user.email);

      // Generate session tokens using admin API
      const { data: sessionResponse, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        }
      });

      if (sessionError || !sessionResponse?.properties?.action_link) {
        console.error('Session generation error:', sessionError);
        return NextResponse.json(
          { error: "Failed to create session" },
          { status: 500 }
        );
      }

      console.log('Session tokens extracted:', {
        hasActionLink: !!sessionResponse.properties?.action_link
      });

      // Return the action link for frontend to handle authentication
      return NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata
        },
        redirectTo: "/dashboard",
        actionLink: sessionResponse.properties.action_link
      });
    }

    // Handle initial password authentication step
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // First, authenticate with password to verify credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }
    
    // Check if user is admin or super_admin
    const { data: userData, error: userRoleError } = await supabase
      .from('users')
      .select('role')
      .eq('email', email)
      .single();
      
    if (!userRoleError && userData && (userData.role === 'admin' || userData.role === 'super_admin')) {
      console.log('Admin user detected, bypassing OTP verification');
      
      // For admin users, return the session data so the client can use it
      // DO NOT sign out - keep the session active
      return NextResponse.json({ 
        success: true,
        message: "Login successful",
        user: data.user,
        session: data.session, // Include the full session for client-side auth
        redirectTo: "/dashboard",
        isAdmin: true
      });
    }
    
    // For regular users, sign out and proceed with OTP verification
    await supabase.auth.signOut();

    // Generate a 6-digit OTP code and store it
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    console.log('Generated OTP:', {
      email,
      otpCode,
      expiresAt: expiresAt.toISOString(),
      expiresAtTimestamp: expiresAt.getTime(),
      currentTime: new Date().toISOString(),
      currentTimestamp: Date.now()
    });

    // Store OTP in database for verification (using UTC timestamps)
    const { error: dbError, data: insertData } = await supabase
      .from('email_otp')
      .insert({
        email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(), // This ensures UTC format
        used: false
      })
      .select();

    console.log('OTP insert result:', { dbError, insertData });

    if (dbError) {
      console.error('Database error storing OTP:', dbError);
      return NextResponse.json(
        { error: "Failed to generate verification code" },
        { status: 500 }
      );
    }

    // Send custom OTP email using Resend directly
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY environment variable is not set');
      }

      const resend = new Resend(process.env.RESEND_API_KEY);

      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'security@yourapp.com',
        to: [email],
        subject: '🔐 Your Security Code - Complete Your Login',
        html: generateOTPEmailHTML({
          otpCode,
          userEmail: email,
          appName: "The International Will Registry",
          companyName: "The International Will Registry"
        })
      });

      console.log('OTP email sent successfully via Resend:', emailResult);

    } catch (error) {
      console.error('Error sending OTP email:', error);
      
      // Clean up the OTP record if email failed
      await supabase
        .from('email_otp')
        .delete()
        .eq('email', email)
        .eq('otp_code', otpCode);
        
      return NextResponse.json(
        { error: "Failed to send verification code" },
        { status: 500 }
      );
    }

    // Return success with redirect instruction
    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
      redirectTo: `/verify-otp?email=${encodeURIComponent(email)}`
    });

  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}