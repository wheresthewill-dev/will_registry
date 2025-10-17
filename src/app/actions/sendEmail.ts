'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmailAction(emailData: EmailData) {
  try {
    console.log('📧 Server Action: Sending email to:', emailData.to);

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log('✅ Server Action: Email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Server Action: Email failed:', error);
    return { success: false, error: error.message };
  }
}
