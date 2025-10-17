import { NextRequest, NextResponse } from "next/server";
import { sendEmailAction } from "@/app/actions/sendEmail";
import { createAdminClient } from "@/app/utils/supabase/admin";

// Create service role client for server-side operations
const supabaseServiceRole = createAdminClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, inviterUserId, acceptorName, acceptorEmail, relationship } =
      body;

    if (!type || !inviterUserId || !acceptorName || !acceptorEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the inviter's details from the database
    const { data: inviterData, error: inviterError } = await supabaseServiceRole
      .from("users")
      .select("firstname, lastname, email")
      .eq("id", inviterUserId)
      .single();

    if (inviterError || !inviterData) {
      console.error("Failed to fetch inviter details:", inviterError);
      return NextResponse.json(
        { error: "Failed to fetch inviter details" },
        { status: 500 }
      );
    }

    const inviterName = `${inviterData.firstname} ${inviterData.lastname}`;
    const inviterEmail = inviterData.email;

    let subject: string;
    let html: string;

    if (type === "representative") {
      subject = `${acceptorName} has accepted your Authorised Representative invitation`;
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Representative Invitation Accepted</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
              .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
              .success-box { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Invitation Accepted!</h1>
            </div>
            
            <div class="content">
              <p>Dear ${inviterName},</p>
              
              <div class="success-box">
                <p><strong>Great news!</strong> ${acceptorName} (${acceptorEmail}) has accepted your invitation to serve as your Authorised Representative.</p>
              </div>
              
              <p>This means:</p>
              <ul>
                <li>✅ ${acceptorName} can now access and manage your will documents</li>
                <li>✅ They can make authorised decisions on your behalf</li>
                <li>✅ Your estate planning is now more secure with trusted representation</li>
              </ul>
              
              <p>You can view and manage your authorised representatives by logging into your account.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/representatives" class="button">
                View My Representatives
              </a>
              
              <p>If you have any questions about your authorised representatives or need assistance, please don't hesitate to contact our support team.</p>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>
              The International Will Registry Team</p>
              
              <p><small>This is an automated notification. Please do not reply to this email.</small></p>
            </div>
          </body>
        </html>
      `;
    } else if (type === "emergency_contact") {
      subject = `${acceptorName} has accepted your Emergency Contact invitation`;
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Emergency Contact Invitation Accepted</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
              .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
              .success-box { background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; background-color: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Emergency Contact Accepted!</h1>
            </div>
            
            <div class="content">
              <p>Dear ${inviterName},</p>
              
              <div class="success-box">
                <p><strong>Great news!</strong> ${acceptorName} (${acceptorEmail}) has accepted your invitation to serve as your Emergency Contact${relationship ? ` (${relationship})` : ""}.</p>
              </div>
              
              <p>This means:</p>
              <ul>
                <li>✅ ${acceptorName} will be available during emergency situations</li>
                <li>✅ They can provide assistance when you cannot be reached</li>
                <li>✅ They will help coordinate care or support when needed</li>
                <li>✅ Your emergency contact information is now complete</li>
              </ul>
              
              <p>You can view and manage your emergency contacts by logging into your account.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/emergency-contacts" class="button">
                View My Emergency Contacts
              </a>
              
              <p>If you have any questions about your emergency contacts or need assistance, please don't hesitate to contact our support team.</p>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>
              The International Will Registry Team</p>
              
              <p><small>This is an automated notification. Please do not reply to this email.</small></p>
            </div>
          </body>
        </html>
      `;
    } else {
      return NextResponse.json(
        { error: "Invalid notification type" },
        { status: 400 }
      );
    }

    // Send the email using the existing sendEmail action
    const emailResult = await sendEmailAction({
      to: inviterEmail,
      subject: subject,
      html: html,
    });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: "Acceptance notification sent successfully",
      });
    } else {
      console.error(
        "Failed to send acceptance notification:",
        emailResult.error
      );
      return NextResponse.json(
        {
          error: "Failed to send notification email",
          details: emailResult.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in acceptance notification API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
