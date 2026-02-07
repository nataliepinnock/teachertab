import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

const feedbackSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  reason: z.enum(['subscription_canceled', 'account_deleted', 'general']),
  feedback: z.string().min(10, 'Please provide at least 10 characters of feedback'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = feedbackSchema.parse(body);

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const feedbackRecipientEmail = process.env.FEEDBACK_RECIPIENT_EMAIL || resendFromEmail;

    const reasonLabels: Record<string, string> = {
      subscription_canceled: 'Subscription Canceled',
      account_deleted: 'Account Deleted',
      general: 'General Feedback',
    };

    const emailSubject = `TeacherTab Feedback: ${reasonLabels[data.reason]}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>TeacherTab Feedback</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #1f2937;">New Feedback Submission</h2>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Received from TeacherTab feedback form</p>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Reason:</td>
                <td style="padding: 8px 0; color: #1f2937;">${reasonLabels[data.reason]}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; vertical-align: top;">Feedback:</td>
                <td style="padding: 8px 0; color: #1f2937; white-space: pre-wrap;">${data.feedback}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Note:</strong> This feedback was submitted through the TeacherTab feedback form.
            </p>
          </div>
        </body>
      </html>
    `;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: resendFromEmail,
          to: feedbackRecipientEmail,
          replyTo: data.email,
          subject: emailSubject,
          html: emailHtml,
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('[feedback] Error sending email via Resend:', {
          error: error instanceof Error ? error.message : String(error),
        });
        
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: 'Failed to send feedback. Please try again later.' },
            { status: 500 }
          );
        }
        // In development, log but don't fail
        console.warn('[feedback] Email sending failed, but continuing in development mode');
        return NextResponse.json({ success: true });
      }
    } else {
      // Development fallback: log the feedback
      console.info('[feedback] Email service not configured. Feedback details:', data);
      
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Email service is not configured. Please contact support.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('[feedback] Error processing feedback:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process feedback. Please try again.' },
      { status: 500 }
    );
  }
}

