import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    console.log(' PUMASOK DITO ');
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { to, subject, html, text } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    console.log(`Sending email via Resend to: ${to}`);

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@theinternationalwillregistry.com', // Change this to your custom domain
      // TODO(cuisonenrico): Update to your verified domain email like: noreply@internationalwillregistry.com
      to: [to],
      subject,
      html,
      text,
    });

    console.log('Resend response:', data);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Resend API error:', {
      message: error.message,
      name: error.name,
      status: error.status,
      cause: error.cause
    });

    // Handle specific Resend errors
    if (error.name === 'validation_error') {
      return NextResponse.json(
        { error: 'Email validation failed', details: error.message },
        { status: 400 }
      );
    }

    if (error.name === 'missing_required_field') {
      return NextResponse.json(
        { error: 'Missing required email field', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
