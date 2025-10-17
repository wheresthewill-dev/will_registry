/**
 * Contact Form Service for handling contact form submissions
 * Uses the existing email service infrastructure to send contact form emails
 */

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

/**
 * Creates an email template for contact form submissions
 */
function createContactFormTemplate(data: ContactFormData, toEmail: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #4b5563; }
          .value { margin-top: 5px; }
          .message-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0; }
          .footer { margin-top: 20px; padding: 15px; text-align: center; font-size: 14px; color: #6b7280; background-color: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          </div>
          <div class="content">
            <p>A visitor has submitted a contact form on your website. Details are below:</p>
            
            <div class="field">
              <div class="label">Name:</div>
              <div class="value">${data.firstName} ${data.lastName}</div>
            </div>
            
            <div class="field">
              <div class="label">Email Address:</div>
              <div class="value">${data.email}</div>
            </div>
            
            <div class="field">
              <div class="label">Message:</div>
              <div class="message-box">${data.message}</div>
            </div>
            
            <p>You can reply directly to this email to respond to ${data.firstName}.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} The International Will Registry. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    New Contact Form Submission
    
    Name: ${data.firstName} ${data.lastName}
    Email: ${data.email}
    
    Message:
    ${data.message}
    
    © ${new Date().getFullYear()} The International Will Registry
  `;

  return {
    to: toEmail,
    subject: `Contact Form: ${data.firstName} ${data.lastName}`,
    html,
    text,
    replyTo: data.email,
  };
}

/**
 * Sends a contact form submission email
 */
export async function sendContactFormEmail(data: ContactFormData, toEmail: string): Promise<{success: boolean, error?: string}> {
  try {
    console.log("📧 ContactFormService: Sending contact form email...");
    const template = createContactFormTemplate(data, toEmail);

    // Send using Server Actions (more reliable for server-side operations)
    const { sendEmailAction } = await import('../app/actions/sendEmail');
    const result = await sendEmailAction(template);
    
    if (result.success) {
      console.log('✅ Contact form email sent successfully');
      return { success: true };
    } else {
      console.error('❌ Failed to send contact form email:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Contact form submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Alternative method using the API route instead of server actions
export async function sendContactFormEmailViaAPI(data: ContactFormData, toEmail: string): Promise<{success: boolean, error?: string}> {
  try {
    console.log("📧 ContactFormService: Sending contact form email via API route...");
    const template = createContactFormTemplate(data, toEmail);

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("❌ Contact form API error:", errorData);
      return { success: false, error: errorData.error || "Failed to send email" };
    }

    const result = await response.json();
    console.log("✅ Contact form email sent successfully:", result);
    return { success: true };
  } catch (error) {
    console.error('❌ Contact form submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
