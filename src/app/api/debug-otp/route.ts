import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/app/utils/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const otp = searchParams.get('otp');

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get all recent OTP records for this email
    const { data: allRecords, error: allError } = await supabase
      .from('email_otp')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(5);

    // If OTP is provided, check for exact match
    let exactMatch = null;
    if (otp) {
      const { data: exactRecord, error: exactError } = await supabase
        .from('email_otp')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otp)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      exactMatch = { record: exactRecord, error: exactError };
    }

    return NextResponse.json({
      success: true,
      email,
      otp: otp || 'not provided',
      currentTime: new Date().toISOString(),
      allRecords: allRecords || [],
      recordCount: allRecords?.length || 0,
      exactMatch,
      errors: {
        allError,
        exactError: exactMatch?.error
      }
    });

  } catch (error) {
    console.error("Debug OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
