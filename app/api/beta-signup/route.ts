import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const betaSignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  school: z.string().min(1, 'School is required'),
  location: z.string().min(1, 'Location is required'),
  stage: z.string().min(1, 'Teaching stage is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = betaSignupSchema.parse(body);

    // Get email configuration from environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const betaSignupRecipientEmail = process.env.BETA_SIGNUP_RECIPIENT_EMAIL;

    if (!betaSignupRecipientEmail) {
      console.error('[beta-signup] BETA_SIGNUP_RECIPIENT_EMAIL environment variable is not set');
      return NextResponse.json(
        { error: 'Email service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Format the email content
    const emailSubject = `New Beta Signup: ${data.name}`;
    const emailHtml = `
      <h2>New Beta Signup Request</h2>
      <p>You have received a new beta signup request:</p>
      <ul>
        <li><strong>Name:</strong> ${data.name}</li>
        <li><strong>Email:</strong> ${data.email}</li>
        <li><strong>School/Institution:</strong> ${data.school}</li>
        <li><strong>Location:</strong> ${data.location}</li>
        <li><strong>Teaching Stage:</strong> ${data.stage}</li>
      </ul>
      <p><em>Submitted at: ${new Date().toLocaleString()}</em></p>
    `;

    // Send email if Resend is configured
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: resendFromEmail,
          to: betaSignupRecipientEmail,
          subject: emailSubject,
          html: emailHtml,
        });

        console.info(`[beta-signup] Email sent via Resend to ${betaSignupRecipientEmail}`);
      } catch (error) {
        console.error('[beta-signup] Error sending email via Resend:', {
          error: error instanceof Error ? error.message : String(error),
          from: resendFromEmail,
          to: betaSignupRecipientEmail,
        });
        // Continue even if email fails - we still want to log the signup
      }
    } else {
      // Development fallback: log the signup
      console.info('[beta-signup] Email service not configured. Signup details:', data);
      
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Email service is not configured. Please contact support.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[beta-signup] Error processing signup:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process signup. Please try again.' },
      { status: 500 }
    );
  }
}

