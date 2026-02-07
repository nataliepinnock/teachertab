import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const resendFromName = process.env.RESEND_FROM_NAME || 'TeacherTab';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!resend) {
    // In development, log the email instead of sending
    if (process.env.NODE_ENV === 'development') {
      // Log email details for development
      return;
    }
    // In production, throw error if email service is not configured
    throw new Error('Email service is not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    await resend.emails.send({
      from: options.from || `${resendFromName} <${resendFromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to send email: ${errorMessage}`);
  }
}

