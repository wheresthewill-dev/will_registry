interface OTPEmailTemplateProps {
  otpCode: string;
  userEmail: string;
  appName?: string;
  companyName?: string;
}

export function generateOTPEmailHTML({
  otpCode,
  userEmail,
  appName = "The International Will Registry",
  companyName = "The International Will Registry"
}: OTPEmailTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Security Verification - ${appName}</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      
      <!-- Email Container -->
      <table role="presentation" style="width: 100%; margin: 0; padding: 20px 0; background-color: #f8fafc;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  <table role="presentation" style="width: 100%;">
                    <tr>
                      <td align="center">
                        <!-- Logo -->
                        <div style="margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
                          <img src="${process.env.NEXT_PUBLIC_EMAIL_LOGO_URL || 'https://app.wheresthewill.com/assets/global/logo-plain.png'}" alt="The International Will Registry" style="max-height: 60px; width: auto;" />
                        </div>
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">Security Verification</h1>
                        <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0; font-size: 16px; font-weight: 400;">Complete your login to ${appName}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <table role="presentation" style="width: 100%;">
                    
                    <!-- Welcome Message -->
                    <tr>
                      <td style="text-align: center; padding-bottom: 30px;">
                        <h2 style="color: #1a202c; margin: 0 0 12px; font-size: 24px; font-weight: 600;">Your Verification Code</h2>
                        <p style="color: #4a5568; margin: 0; font-size: 16px; line-height: 1.5;">
                          We've sent this code to <strong>${userEmail}</strong><br>
                          Enter it in your browser to continue
                        </p>
                      </td>
                    </tr>

                    <!-- OTP Code Section -->
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <table role="presentation" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.25); margin: 0 auto;">
                          <tr>
                            <td style="padding: 30px 40px; text-align: center;">
                              <div style="color: white; font-size: 48px; font-weight: 800; letter-spacing: 8px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', Consolas, monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 8px;">
                                ${otpCode}
                              </div>
                              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px; font-weight: 500;">Valid for 10 minutes only</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Instructions -->
                    <tr>
                      <td style="padding: 30px 0 20px;">
                        <table role="presentation" style="width: 100%; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                          <tr>
                            <td style="padding: 25px;">
                              <h3 style="color: #2d3748; margin: 0 0 20px; font-size: 18px; font-weight: 600;">Quick Steps:</h3>
                              
                              <table role="presentation" style="width: 100%;">
                                <tr>
                                  <td style="width: 30px; vertical-align: top; padding-bottom: 15px;">
                                    <div style="background-color: #3182ce; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                      <span style="color: white; font-size: 14px; font-weight: bold;">1</span>
                                    </div>
                                  </td>
                                  <td style="vertical-align: top; padding-bottom: 15px; padding-left: 12px;">
                                    <p style="margin: 0; color: #2d3748; font-size: 15px; line-height: 1.5; font-weight: 500;">Return to your browser and enter the 6-digit code above</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="width: 30px; vertical-align: top; padding-bottom: 15px;">
                                    <div style="background-color: #3182ce; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                      <span style="color: white; font-size: 14px; font-weight: bold;">2</span>
                                    </div>
                                  </td>
                                  <td style="vertical-align: top; padding-bottom: 15px; padding-left: 12px;">
                                    <p style="margin: 0; color: #2d3748; font-size: 15px; line-height: 1.5; font-weight: 500;">Click "Verify Code" to complete your login</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="width: 30px; vertical-align: top;">
                                    <div style="background-color: #3182ce; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                      <span style="color: white; font-size: 14px; font-weight: bold;">3</span>
                                    </div>
                                  </td>
                                  <td style="vertical-align: top; padding-left: 12px;">
                                    <p style="margin: 0; color: #2d3748; font-size: 15px; line-height: 1.5; font-weight: 500;">You'll be automatically redirected to your dashboard</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Security Notice -->
                    <tr>
                      <td style="padding: 20px 0 30px;">
                        <table role="presentation" style="width: 100%; background-color: #fef5e7; border: 1px solid #f6ad55; border-radius: 12px;">
                          <tr>
                            <td style="padding: 25px;">
                              <table role="presentation">
                                <tr>
                                  <td style="vertical-align: top; width: 30px; padding-right: 12px;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#d69e2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                  </td>
                                  <td style="vertical-align: top;">
                                    <h3 style="color: #b7791f; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Security Notice</h3>
                                    <ul style="color: #744210; margin: 0; padding-left: 16px; font-size: 14px; line-height: 1.6;">
                                      <li style="margin-bottom: 8px;">This code can only be used once and expires in 10 minutes</li>
                                      <li style="margin-bottom: 8px;">Never share this code with anyone</li>
                                      <li>If you didn't request this login, please ignore this email and consider changing your password</li>
                                    </ul>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                  <p style="color: #718096; margin: 0 0 8px; font-size: 14px; font-weight: 500;">This is an automated security message from ${appName}</p>
                  <p style="color: #a0aec0; margin: 0; font-size: 12px; line-height: 1.4;">
                    © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
                    This email was sent to ${userEmail}. Please do not reply to this message.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Deceased notification email template interface
interface DeceasedNotificationEmailTemplateProps {
  representativeName: string;
  deceasedPersonName: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  loginUrl?: string;
  appName?: string;
  companyName?: string;
}

export function generateDeceasedNotificationEmailHTML({
  representativeName,
  deceasedPersonName,
  emergencyContactName,
  emergencyContactRelationship,
  loginUrl = "https://app.wheresthewill.com/login",
  appName = "The International Will Registry",
  companyName = "The International Will Registry"
}: DeceasedNotificationEmailTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Important Estate Notification - ${appName}</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      
      <!-- Email Container -->
      <table role="presentation" style="width: 100%; margin: 0; padding: 20px 0; background-color: #f8fafc;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  <table role="presentation" style="width: 100%;">
                    <tr>
                      <td align="center">
                        <!-- Logo -->
                        <div style="margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
                          <img src="${process.env.NEXT_PUBLIC_EMAIL_LOGO_URL || 'https://app.wheresthewill.com/assets/global/logo-plain.png'}" alt="The International Will Registry" style="max-height: 60px; width: auto;" />
                        </div>
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Important Estate Notification</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px; font-weight: 400;">Immediate action required as an Authorized Representative</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <table role="presentation" style="width: 100%;">
                    <tr>
                      <td>
                        <!-- Greeting -->
                        <h2 style="color: #1a202c; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Dear ${representativeName},</h2>
                        
                        <!-- Main Message -->
                        <div style="background-color: #fef5e7; border: 1px solid #f6ad55; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                          <div style="display: flex; align-items: flex-start;">
                            <div style="flex-shrink: 0; margin-right: 12px;">
                              <div style="background-color: #ed8936; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 14px; font-weight: bold;">!</span>
                              </div>
                            </div>
                            <div>
                              <h3 style="color: #744210; margin: 0 0 10px; font-size: 18px; font-weight: 600;">Estate Owner Deceased Notification</h3>
                              <p style="color: #744210; margin: 0; font-size: 15px; line-height: 1.5;">
                                We have been notified that <strong>${deceasedPersonName}</strong> has passed away. 
                                This notification was submitted by ${emergencyContactName}, who is listed as their ${emergencyContactRelationship}.
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- Your Responsibilities -->
                        <div style="margin-bottom: 30px;">
                          <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 20px; font-weight: 600;">Your Responsibilities as an Authorized Representative</h3>
                          <p style="color: #4a5568; margin: 0 0 15px; font-size: 15px; line-height: 1.6;">
                            As an authorized representative for ${deceasedPersonName}'s estate, you now have important responsibilities:
                          </p>
                          <ul style="color: #4a5568; margin: 0 0 20px; padding-left: 20px; font-size: 15px; line-height: 1.6;">
                            <li style="margin-bottom: 8px;">Access and review their estate documents and will</li>
                            <li style="margin-bottom: 8px;">Coordinate with other authorized representatives if applicable</li>
                            <li style="margin-bottom: 8px;">Follow the instructions outlined in their estate planning documents</li>
                            <li style="margin-bottom: 8px;">Contact appropriate legal and financial professionals as needed</li>
                          </ul>
                        </div>

                        <!-- Action Required -->
                        <div style="background-color: #e6fffa; border: 1px solid #38b2ac; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                          <h3 style="color: #234e52; margin: 0 0 10px; font-size: 18px; font-weight: 600;">Immediate Action Required</h3>
                          <p style="color: #234e52; margin: 0 0 15px; font-size: 15px; line-height: 1.5;">
                            Please log into your ${appName} account to access ${deceasedPersonName}'s estate documents and begin fulfilling your responsibilities.
                          </p>
                          <div style="text-align: center; margin: 20px 0;">
                            <a href="${loginUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); transition: all 0.2s;">
                              Access Estate Documents
                            </a>
                          </div>
                        </div>

                        <!-- Support Information -->
                        <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                          <h3 style="color: #2d3748; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Need Help?</h3>
                          <p style="color: #4a5568; margin: 0; font-size: 14px; line-height: 1.5;">
                            If you have questions about your responsibilities or need assistance accessing the estate documents, 
                            please contact our support team or consult with legal professionals experienced in estate administration.
                          </p>
                        </div>

                        <!-- Condolences -->
                        <p style="color: #4a5568; margin: 20px 0 0; font-size: 15px; line-height: 1.6; font-style: italic;">
                          Our thoughts are with you and all those affected by this loss. We're here to support you through this difficult process.
                        </p>

                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                  <p style="color: #718096; margin: 0 0 8px; font-size: 14px; font-weight: 500;">This is an important notification from ${appName}</p>
                  <p style="color: #a0aec0; margin: 0; font-size: 12px; line-height: 1.4;">
                    © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
                    This notification was sent due to your role as an authorized representative. Please do not reply to this message.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Export the interface as well for better TypeScript support
export type { OTPEmailTemplateProps, DeceasedNotificationEmailTemplateProps };
