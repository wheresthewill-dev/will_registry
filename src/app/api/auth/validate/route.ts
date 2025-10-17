import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/utils/supabase/admin";

// Create admin client with service role
const supabaseAdmin = createAdminClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username } = body;

    console.log("🔄 Server: Validating user data...");
    console.log("📧 Email:", email);
    console.log("👤 Username:", username);

    // Check if email is already in use
    const { data: emailData, error: emailError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (emailError) {
      return NextResponse.json(
        { success: false, error: `Email check failed: ${emailError.message}` },
        { status: 500 }
      );
    }

    if (emailData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This email address is already associated with an account. Please use a different email or log in to your existing account.",
        },
        { status: 400 }
      );
    }

    // Check if username is already in use
    const { data: usernameData, error: usernameError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (usernameError) {
      return NextResponse.json(
        {
          success: false,
          error: `Username check failed: ${usernameError.message}`,
        },
        { status: 500 }
      );
    }

    if (usernameData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The username you entered is already taken. Please choose a different username to proceed.",
        },
        { status: 400 }
      );
    }

    // If we get here, all validations passed
    // Process registration in the background (if desired)
    if (body.processInBackground) {
      // You could start a background process here to register the user
      // This would be useful if you want to complete registration before
      // the user reaches the final confirmation step
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: "User data validation successful",
    });
  } catch (err: any) {
    console.error("❌ Validation failed:", err);
    return NextResponse.json(
      { success: false, error: `Validation failed: ${err.message}` },
      { status: 500 }
    );
  }
}
