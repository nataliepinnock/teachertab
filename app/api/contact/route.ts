import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Please provide at least 10 characters describing your issue'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const contactRecipientEmail = process.env.CONTACT_RECIPIENT_EMAIL || process.env.FEEDBACK_RECIPIENT_EMAIL || resendFromEmail;

    const emailSubject = `TeacherTab Contact Form: Question from ${data.name}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>TeacherTab Contact Form</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #1f2937;">New Contact Form Submission</h2>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Received from TeacherTab contact widget</p>
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
                <td style="padding: 8px 0; font-weight: 600; color: #374151; vertical-align: top;">Message:</td>
                <td style="padding: 8px 0; color: #1f2937; white-space: pre-wrap;">${data.message}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 6px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>Note:</strong> This message was submitted through the TeacherTab contact widget. You can reply directly to this email to respond to the user.
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
          to: contactRecipientEmail,
          replyTo: data.email,
          subject: emailSubject,
          html: emailHtml,
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('[contact] Error sending email via Resend:', {
          error: error instanceof Error ? error.message : String(error),
        });
        
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: 'Failed to send message. Please try again later.' },
            { status: 500 }
          );
        }
        // In development, log but don't fail
        console.warn('[contact] Email sending failed, but continuing in development mode');
        return NextResponse.json({ success: true });
      }
    } else {
      // Development fallback: log the contact
      console.info('[contact] Email service not configured. Contact details:', data);
      
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Email service is not configured. Please contact support.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('[contact] Error processing contact form:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process contact form. Please try again.' },
      { status: 500 }
    );
  }
}

