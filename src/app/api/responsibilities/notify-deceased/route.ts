import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/utils/supabase/admin";
import { Resend } from "resend";
import { generateDeceasedNotificationEmailHTML } from "@/lib/email-templates";
import { isRepresentativeActive } from "@/app/utils/repo_services/interfaces/user_authorized_representative";

// Create a Supabase client with service role key for admin operations
const supabase = createAdminClient();

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

interface NotifyDeceasedRequest {
  contactId: string;
  userId: string; // The deceased person's user ID
  emergencyContactName: string;
  emergencyContactRelationship: string;
}

interface AuthorizedRepresentative {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  status: string;
  ar_user_id: number;
}

export async function POST(request: NextRequest) {
  console.log("💀 POST /api/responsibilities/notify-deceased - Starting deceased notification process");

  try {
    // Check if required environment variables are configured
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY environment variable is not set");
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Parse the request body
    const body = await request.text();
    console.log("📄 Request body text:", body);

    let parsedBody: NotifyDeceasedRequest;
    try {
      parsedBody = JSON.parse(body);
      console.log("✅ Parsed JSON body:", parsedBody);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const { contactId, userId, emergencyContactName, emergencyContactRelationship } = parsedBody;

    // Validate required fields
    if (!contactId || !userId || !emergencyContactName || !emergencyContactRelationship) {
      console.error("❌ Missing required fields in request");
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: "contactId, userId, emergencyContactName, and emergencyContactRelationship are required",
        },
        { status: 400 }
      );
    }

    // Validate userId is a number
    const userIdNum = parseInt(userId.toString());
    if (isNaN(userIdNum)) {
      console.error("❌ Invalid userId format:", userId);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid userId format",
          details: "userId must be a valid number",
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking up user and representatives for userId: ${userIdNum}`);

    // 1. Get the deceased person's information
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, firstname, lastname, is_deceased")
      .eq("id", userIdNum)
      .single();

    if (userError || !userData) {
      console.error("❌ Failed to fetch user data:", userError);
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          details: userError?.message || "The specified user could not be found",
        },
        { status: 404 }
      );
    }

    console.log(`👤 Found user: ${userData.firstname} ${userData.lastname}`);

    // Check if user is already marked as deceased
    if (userData.is_deceased) {
      console.log("⚠️ User is already marked as deceased");
      return NextResponse.json(
        {
          success: false,
          error: "User already marked as deceased",
          details: "This user has already been marked as deceased",
        },
        { status: 400 }
      );
    }

    // 2. Get all authorized representatives for this user
    const { data: representativesData, error: representativesError } = await supabase
      .from("user_authorized_representatives")
      .select("id, firstname, lastname, email, status, ar_user_id")
      .eq("user_id", userIdNum);

    if (representativesError) {
      console.error("❌ Failed to fetch representatives:", representativesError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch representatives",
          details: representativesError.message,
        },
        { status: 500 }
      );
    }

    console.log(`📧 Found ${representativesData?.length || 0} representatives`);

    // Filter only active (registered) representatives
    const activeRepresentatives = (representativesData || []).filter((rep: AuthorizedRepresentative) => 
      isRepresentativeActive(rep as any)
    );

    if (activeRepresentatives.length === 0) {
      console.log("⚠️ No active representatives found");
      return NextResponse.json(
        {
          success: false,
          error: "No active representatives found",
          details: "This user has no registered authorized representatives to notify",
        },
        { status: 400 }
      );
    }

    console.log(`📨 Will notify ${activeRepresentatives.length} active representatives`);

    // 3. Mark the user as deceased in the database
    const { error: updateError } = await supabase
      .from("users")
      .update({ is_deceased: true })
      .eq("id", userIdNum);

    if (updateError) {
      console.error("❌ Failed to mark user as deceased:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update user status",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ Successfully marked user as deceased");

    // 4. Send notification emails to all active representatives
    const emailPromises = activeRepresentatives.map(async (rep: AuthorizedRepresentative) => {
      const representativeName = `${rep.firstname} ${rep.lastname}`.trim() || "Representative";
      const deceasedPersonName = `${userData.firstname} ${userData.lastname}`.trim() || "Estate Owner";

      const emailHtml = generateDeceasedNotificationEmailHTML({
        representativeName,
        deceasedPersonName,
        emergencyContactName,
        emergencyContactRelationship,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.wheresthewill.com'}/login`,
        appName: "The International Will Registry",
        companyName: "The International Will Registry"
      });

      try {
        console.log(`📧 Sending email to ${rep.email}`);
        
        const emailData = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'notifications@internationalwillregistry.com',
          to: [rep.email],
          subject: `Important Estate Notification - ${deceasedPersonName} has passed away`,
          html: emailHtml,
        });

        console.log(`✅ Email sent successfully to ${rep.email}:`, emailData);
        
        return {
          representative: representativeName,
          email: rep.email,
          success: true,
          emailId: emailData.data?.id
        };
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${rep.email}:`, emailError);
        
        return {
          representative: representativeName,
          email: rep.email,
          success: false,
          error: (emailError as Error).message
        };
      }
    });

    // Wait for all emails to be sent
    const emailResults = await Promise.all(emailPromises);
    
    // Count successful and failed emails
    const successfulEmails = emailResults.filter(result => result.success);
    const failedEmails = emailResults.filter(result => !result.success);

    console.log(`📊 Email results: ${successfulEmails.length} successful, ${failedEmails.length} failed`);

    // Return response with detailed results
    const response = {
      success: true,
      message: "Deceased notification process completed",
      details: {
        userMarkedAsDeceased: true,
        deceasedPerson: `${userData.firstname} ${userData.lastname}`,
        totalRepresentatives: activeRepresentatives.length,
        emailsSent: successfulEmails.length,
        emailsFailed: failedEmails.length,
        emailResults,
      },
    };

    // If some emails failed, include a warning
    if (failedEmails.length > 0) {
      response.message = "Deceased notification completed with some email failures";
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("❌ Unexpected error in notify-deceased endpoint:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// GET method not supported for this endpoint
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      details: "This endpoint only supports POST requests",
    },
    { status: 405 }
  );
}