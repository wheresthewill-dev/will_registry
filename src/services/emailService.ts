/**
 * Email Service for sending invitations and notifications
 * This uses Supabase's built-in email functionality or can be extended with other providers
 */

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface RepresentativeInviteData {
  representativeName: string;
  representativeEmail: string;
  ownerName: string;
  ownerEmail: string;
  temporaryPassword?: string; // Optional for magic link flow
  magicLink?: string; // Optional for magic link flow
  loginUrl: string;
  expiryDate: string;
  isNewAccount?: boolean; // New flag to determine email template
}

export interface EmergencyContactInviteData {
  contactName: string;
  contactEmail: string;
  ownerName: string;
  ownerEmail: string;
  relationship: string;
  temporaryPassword?: string; // Optional for magic link flow
  magicLink?: string; // Optional for magic link flow
  loginUrl: string;
  expiryDate: string;
  isNewAccount?: boolean; // New flag to determine email template
}

class EmailService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  }

  /**
   * Generate a secure temporary password
   */
  generateTemporaryPassword(): string {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Generate login URL
   */
  generateLoginUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/login`;
  }

  /**
   * Create HTML email template for representative invitation
   */
  private createRepresentativeInviteTemplate(
    data: RepresentativeInviteData
  ): EmailTemplate {
    const isNewAccount = data.isNewAccount ?? false;

    const credentialsSection =
      isNewAccount && data.temporaryPassword
        ? `
      <div class="credentials">
        <h3 style="margin-top: 0; color: #1f2937;">Your New Account Credentials</h3>
        <div style="margin: 10px 0;">
          <span style="font-weight: bold; color: #374151;">Email:</span>
          <span style="font-family: monospace; background-color: #ffffff; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; display: inline-block; margin-left: 10px;">${data.representativeEmail}</span>
        </div>
        <div style="margin: 10px 0;">
          <span style="font-weight: bold; color: #374151;">Temporary Password:</span>
          <span style="font-family: monospace; background-color: #ffffff; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; display: inline-block; margin-left: 10px;">${data.temporaryPassword}</span>
        </div>
        <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
          <strong>Important:</strong> Please change your password immediately after logging in for security.
        </p>
      </div>
    `
        : "";

    const magicLinkSection = data.magicLink
      ? `
      <div class="credentials">
        <p><strong>Magic Link:</strong> ${data.magicLink}</p>
      </div>
    `
      : "";

    const loginInstructions = isNewAccount
      ? `<p>A new account has been created for you. To accept this role and access your representative dashboard, please log in using the credentials below:</p>`
      : `<p>Since you already have an account with us, please log in with your existing credentials to accept this invitation:</p>`;

    const nextStepsContent = isNewAccount
      ? `
      <div class="warning">
        <p><strong>Important Next Steps:</strong></p>
        <ol>
          <li>Click the login link below</li>
          <li>Sign in with your email and the temporary password above</li>
          <li>Change your password to something secure and memorable</li>
          <li>Complete your profile information</li>
          <li>You'll then have access to manage the documents</li>
        </ol>
        <p><strong>This invitation expires on ${data.expiryDate}</strong></p>
      </div>
    `
      : `
      <div class="warning">
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Log in to your existing account using the button below</li>
          <li>Check your dashboard for the new representative invitation</li>
          <li>Accept the invitation to complete the process</li>
          <li>You'll then have access to manage ${data.ownerName}'s documents</li>
        </ol>
        <p><strong>This invitation expires on ${data.expiryDate}</strong></p>
      </div>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You've Been Invited as an Authorised Representative</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; }
            .logo { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .title { font-size: 24px; margin: 10px 0; }
            .content { background-color: #ffffff; padding: 30px; }
            .credentials { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .button:hover { background-color: #1d4ed8; }
            .warning { background-color: #fef3cd; border: 1px solid #fbbf24; color: #92400e; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; background-color: #f9fafb; }
            .responsibility-list { background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="margin-bottom: 20px;">
                <img src="${process.env.NEXT_PUBLIC_EMAIL_LOGO_URL || 'https://app.wheresthewill.com/assets/global/logo-plain.png'}" alt="The International Will Registry" style="max-height: 50px; width: auto;" />
              </div>
              <h1 class="title">You've been invited as an Authorised Representative</h1>
              <p>by ${data.ownerName}</p>
            </div>
            
            <div class="content">
              <p>Dear ${data.representativeName},</p>
              
              <p>You have been invited by <strong>${data.ownerName}</strong> (${data.ownerEmail}) to serve as their Authorised Representative for managing their will and estate planning documents.</p>
              
              ${loginInstructions}
              
              ${credentialsSection}
              ${magicLinkSection}
              
              ${nextStepsContent}
              
              <p style="text-align: center;">
                <a href="${data.loginUrl}" class="button">Access Your Representative Dashboard</a>
              </p>
              
              <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser: ${data.loginUrl}</p>
              
              <div class="responsibility-list">
                <h3 style="margin-top: 0; color: #1f2937;">What this means:</h3>
                <ul>
                  <li>You will have access to ${data.ownerName}'s will and estate planning documents</li>
                  <li>You may be contacted in case of emergency or if the documents need to be executed</li>
                  <li>You can update your contact information and manage your representative profile</li>
                  <li>You can decline this responsibility at any time</li>
                </ul>
              </div>
              
              <p>If you have any questions or did not expect this invitation, please contact ${data.ownerName} directly at ${data.ownerEmail}.</p>
              
              <p>Thank you for accepting this important responsibility.</p>
            </div>
            
            <div class="footer">
              <p>This invitation was sent by ${data.ownerName} (${data.ownerEmail}) through The International Will Registry.</p>
              <p>© 2025 The International Will Registry. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Authorised Representative Invitation - The International Will Registry
      
      Dear ${data.representativeName},
      
      You have been invited by ${data.ownerName} (${data.ownerEmail}) to serve as their Authorised Representative through The International Will Registry.
      
      ${
        isNewAccount && data.temporaryPassword
          ? `Your login credentials:
      Email: ${data.representativeEmail}
      Temporary Password: ${data.temporaryPassword}
      
      Please change your password after your first login for security.`
          : "Please log in with your existing credentials to accept this invitation."
      }
      
      Sign in to your account: ${data.loginUrl}
      
      This invitation expires on ${data.expiryDate}.
      
      © 2025 The International Will Registry. All rights reserved.
    `;

    return {
      to: data.representativeEmail,
      subject: `You've been invited as an Authorised Representative by ${data.ownerName}`,
      html,
      text,
    };
  }

  /**
   * Send representative invitation email
   */
  async sendRepresentativeInvitation(
    data: RepresentativeInviteData
  ): Promise<boolean> {
    try {
      console.log("🚀 EmailService: Starting email send process...");
      const template = this.createRepresentativeInviteTemplate(data);

      console.log(
        `📧 EmailService: Sending invitation email to ${data.representativeEmail}...`
      );

      // Option 1: Use API route (current approach)
      console.log("📡 EmailService: Using API route method");
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      console.log("📨 EmailService: Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("❌ Email API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return false;
      }

      const result = await response.json();
      console.log("✅ Representative invitation email sent successfully:", {
        to: data.representativeEmail,
        representative: data.representativeName,
        messageId: result.data?.id || "unknown",
      });
      return true;

      // Option 2: Use Server Action (alternative approach)
      // Uncomment this and comment out the API route code above to use server actions
      /*
      console.log('📡 EmailService: Using Server Action method');
      const { sendEmailAction } = await import('../app/actions/sendEmail');
      const result = await sendEmailAction(template);
      
      if (result.success) {
        console.log('✅ Representative invitation email sent successfully:', {
          to: data.representativeEmail,
          representative: data.representativeName,
          messageId: result.data?.id || 'unknown'
        });
        return true;
      } else {
        console.error('❌ Server Action email error:', result.error);
        return false;
      }
      */
    } catch (error) {
      console.error("❌ Failed to send representative invitation email:", {
        error: error instanceof Error ? error.message : "Unknown error",
        recipient: data.representativeEmail,
        representative: data.representativeName,
      });
      return false;
    }
  }

  /**
   * Create emergency contact invitation email template
   */
  createEmergencyContactInviteTemplate(
    data: EmergencyContactInviteData
  ): EmailTemplate {
    const isNewAccount = data.isNewAccount ?? false;

    const credentialsSection =
      isNewAccount && data.temporaryPassword
        ? `
      <div class="credentials-box">
        <h3 style="margin-top: 0; color: #1f2937;">Your New Account Credentials</h3>
        <div class="credential-item">
          <span class="credential-label">Email:</span>
          <span class="credential-value">${data.contactEmail}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Temporary Password:</span>
          <span class="credential-value">${data.temporaryPassword}</span>
        </div>
        <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
          <strong>Important:</strong> Please change your password immediately after logging in for security.
        </p>
      </div>
    `
        : "";

    const loginInstructions = isNewAccount
      ? `<p>A new account has been created for you. To accept this role and access your emergency contact dashboard, please log in using the credentials below:</p>`
      : `<p>Since you already have an account with us, please log in with your existing credentials to accept this invitation:</p>`;

    const securityNotice = isNewAccount
      ? `
      <div class="warning">
        <strong>Important Security Notice:</strong><br>
        • Please change your password immediately after logging in<br>
        • This invitation expires on ${data.expiryDate}<br>
        • Keep your login credentials secure and confidential<br>
        • Contact ${data.ownerName} if you have any questions about this role
      </div>
    `
      : `
      <div class="warning">
        <strong>Next Steps:</strong><br>
        • Log in to your existing account using the button below<br>
        • Check your dashboard for the new emergency contact invitation<br>
        • Accept the invitation to complete the process<br>
        • This invitation expires on ${data.expiryDate}
      </div>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Emergency Contact Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { background-color: #2563eb; color: white; padding: 15px 30px; border-radius: 6px; display: inline-block; font-size: 20px; font-weight: bold; }
          .title { color: #1f2937; font-size: 24px; margin: 20px 0 10px 0; }
          .subtitle { color: #6b7280; font-size: 16px; margin-bottom: 30px; }
          .content { margin: 20px 0; }
          .credentials-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #374151; }
          .credential-value { font-family: monospace; background-color: #ffffff; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; display: inline-block; margin-left: 10px; }
          .cta-button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .cta-button:hover { background-color: #b91c1c; }
          .warning { background-color: #fef3cd; border: 1px solid #fbbf24; color: #92400e; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
          .relationship-badge { background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="margin-bottom: 20px;">
              <img src="${process.env.NEXT_PUBLIC_EMAIL_LOGO_URL || 'https://app.wheresthewill.com/assets/global/logo-plain.png'}" alt="The International Will Registry" style="max-height: 50px; width: auto;" />
            </div>
            <h1 class="title">You've been designated as an Emergency Contact</h1>
            <p class="subtitle">by ${data.ownerName}</p>
          </div>

          <div class="content">
            <p>Dear ${data.contactName},</p>
            
            <p><strong>${data.ownerName}</strong> has designated you as their emergency contact with the relationship: <span class="relationship-badge">${data.relationship}</span></p>
            
            <p>As an emergency contact, you will be able to:</p>
            <ul>
              <li>Receive important notifications about ${data.ownerName}'s estate planning status</li>
              <li>Access critical information in case of emergency</li>
              <li>Serve as a point of contact for estate matters when needed</li>
            </ul>

            ${loginInstructions}

            ${credentialsSection}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" class="cta-button">Access Emergency Contact Dashboard</a>
            </div>

            ${securityNotice}

            <p>If you don't wish to accept this emergency contact role, please contact ${data.ownerName} directly at ${data.ownerEmail}.</p>

            <p>Thank you for accepting this important responsibility.</p>
          </div>

          <div class="footer">
            <p>This invitation was sent by ${data.ownerName} (${data.ownerEmail}) through The International Will Registry.</p>
            <p>© 2025 The International Will Registry. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Emergency Contact Invitation - The International Will Registry

Dear ${data.contactName},

${data.ownerName} has designated you as their emergency contact with the relationship: ${data.relationship} through The International Will Registry.

As an emergency contact, you will be able to:
- Receive important notifications about ${data.ownerName}'s estate planning status
- Access critical information in case of emergency
- Serve as a point of contact for estate matters when needed

To accept this role, please log in using these credentials:

Email: ${data.contactEmail}
Temporary Password: ${data.temporaryPassword}

Login URL: ${data.loginUrl}

Important:
- Please change your password immediately after logging in
- This invitation expires on ${data.expiryDate}
- Contact ${data.ownerName} at ${data.ownerEmail} if you have questions

If you don't wish to accept this role, please contact ${data.ownerName} directly.

Thank you for accepting this important responsibility.

© 2025 The International Will Registry. All rights reserved.
    `;

    return {
      to: data.contactEmail,
      subject: `You've been designated as an Emergency Contact by ${data.ownerName}`,
      html,
      text,
    };
  }

  /**
   * Send emergency contact invitation email
   */
  async sendEmergencyContactInvitation(
    data: EmergencyContactInviteData
  ): Promise<boolean> {
    try {
      console.log(
        "🚀 EmailService: Starting emergency contact email send process..."
      );
      const template = this.createEmergencyContactInviteTemplate(data);

      console.log(
        `📧 EmailService: Sending emergency contact invitation to ${data.contactEmail}...`
      );

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      console.log("📨 EmailService: Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("❌ Emergency contact email API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return false;
      }

      const result = await response.json();
      console.log("✅ Emergency contact invitation email sent successfully:", {
        to: data.contactEmail,
        contact: data.contactName,
        relationship: data.relationship,
        messageId: result.data?.id || "unknown",
      });
      return true;
    } catch (error) {
      console.error("❌ Failed to send emergency contact invitation email:", {
        error: error instanceof Error ? error.message : "Unknown error",
        recipient: data.contactEmail,
        contact: data.contactName,
        relationship: data.relationship,
      });
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(
    testEmail: string = "test@example.com"
  ): Promise<boolean> {
    try {
      const testData: RepresentativeInviteData = {
        representativeName: "Test Representative",
        representativeEmail: testEmail,
        ownerName: "Test Owner",
        ownerEmail: "owner@example.com",
        temporaryPassword: "TestPassword123!",
        loginUrl: this.generateLoginUrl(),
        expiryDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString(),
      };

      return await this.sendRepresentativeInvitation(testData);
    } catch (error) {
      console.error("Email configuration test failed:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
