'use server';

import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  users,
  passwordResetTokens,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { deleteUserIfNoSubscription } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';
import { Resend } from 'resend';
import { getWelcomeEmail, getGoodbyeEmail } from '@/lib/emails/templates';
import { sendEmail, sendUserInfoToResend } from '@/lib/emails/service';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { error: 'Invalid email or password.', email };
  }

  const isValidPassword = await comparePasswords(password, user.passwordHash);
  if (!isValidPassword) {
    return { error: 'Invalid email or password.', email };
  }

  const redirectTo = formData.get('redirect') as string | null;
  const priceId = formData.get('priceId') as string | null;

  const activeStatuses = new Set(['active', 'trialing']);
  const isSubscriptionActive =
    typeof user.subscriptionStatus === 'string' &&
    activeStatuses.has(user.subscriptionStatus);

  if (!isSubscriptionActive) {
    await deleteUserIfNoSubscription(user.id);

    return {
      error:
        "Looks like the payment didn't go through the last time you tried to sign up, so we've cancelled that signup. Please start a new signup when you're ready to try again.",
      email,
      priceId: priceId || undefined
    };
  }

  await setSession(user);

  if (redirectTo === 'checkout') {
    if (!priceId) {
      return {
        error: 'Please choose a subscription plan to continue.',
        email
      };
    }
    return createCheckoutSession({ user, priceId, context: 'existing' });
  }

  redirect('/dashboard');
});

const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  teachingPhase: z.enum(['primary', 'secondary', 'further', 'elementary', 'middle', 'high']),
  colorPreference: z.enum(['class', 'subject']),
  timetableCycle: z.enum(['weekly', '2-weekly']),
  location: z.enum(['UK', 'US', 'Other'])
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { name, email, password, teachingPhase, colorPreference, timetableCycle, location } = data;

  const redirectIntent = formData.get('redirect') as string | null;
  const selectedPriceId = formData.get('priceId') as string | null;
  const termsConsent = formData.get('termsConsent') === 'on' || formData.get('termsConsent') === 'true';

  if (!selectedPriceId) {
    return {
      error: 'Please select a subscription plan to continue.',
      name,
      email
    };
  }

  if (!termsConsent) {
    return {
      error: 'You must agree to the Terms of Service and Privacy Policy to create an account.',
      name,
      email,
      priceId: selectedPriceId
    };
  }

  // Check if user already exists with active subscription
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    const activeStatuses = new Set(['active', 'trialing']);
    const isExistingActive =
      typeof existingUser.subscriptionStatus === 'string' &&
      activeStatuses.has(existingUser.subscriptionStatus);

    if (isExistingActive) {
      return {
        error: 'User with this email already exists.',
        name,
        email,
        priceId: selectedPriceId
      };
    }

    // Remove inactive user if exists
    const removed = await deleteUserIfNoSubscription(existingUser.id);

    if (!removed) {
      return {
        error: 'User with this email already exists.',
        name,
        email,
        priceId: selectedPriceId
      };
    }
  }

  // Hash password before storing in Stripe metadata
  const passwordHash = await hashPassword(password);

  if (redirectIntent === 'checkout') {
    // Get marketing emails preference from form
    const marketingEmails = formData.get('marketingEmails') === 'on' || formData.get('marketingEmails') === 'true';
    
    // Create checkout session with signup data in metadata (no user account yet)
    return createCheckoutSession({
      user: null,
      priceId: selectedPriceId,
      context: 'signup',
      signupData: {
        name,
        email,
        passwordHash,
        teachingPhase: teachingPhase as string,
        colorPreference: colorPreference as string,
        timetableCycle: timetableCycle as string,
        location: location as string,
        marketingEmails: marketingEmails, // Pass marketing emails preference
      }
    });
  }

  return {
    success: 'Account created successfully.',
    priceId: selectedPriceId
  };
});

const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_EXPIRY_MINUTES = 60;
const GENERIC_PASSWORD_RESET_MESSAGE =
  'If an account exists for that email, we just sent over a reset link.';

const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters')
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.'
  });

function getAppBaseUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (explicitUrl && explicitUrl.trim().length > 0) {
    return explicitUrl.replace(/\/$/, '');
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim().length > 0) {
    return `https://${vercelUrl.replace(/\/$/, '')}`;
  }

  return 'http://localhost:3000';
}

async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = getAppBaseUrl();
  const resetLink = `${baseUrl}/reset-password/${token}`;

  const emailSubject = 'Reset your TeacherTab password';
  const emailHtml = `
    <p>Hello,</p>
    <p>We received a request to reset your TeacherTab password. Click the link below to set a new password. This link will expire in ${PASSWORD_RESET_EXPIRY_MINUTES} minutes.</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
  `;

  // Resend email service configuration
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: resendFromEmail || 'onboarding@resend.dev', // Default Resend email if not configured
        to: email,
        subject: emailSubject,
        html: emailHtml,
      });

      console.info(`[password-reset] Email sent via Resend to ${email} from ${resendFromEmail || 'onboarding@resend.dev'}`);
      return;
    } catch (error) {
      console.error('[password-reset] Error sending email via Resend:', {
        error: error instanceof Error ? error.message : String(error),
        from: resendFromEmail || 'onboarding@resend.dev',
        to: email
      });
      throw error;
    }
  }

  // Development fallback: log the link
  console.info(
    `[password-reset] Email service not configured. Generated link for ${email}: ${resetLink}`
  );
  
  // In production, require email configuration
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Email service not configured. Please set RESEND_API_KEY environment variable.'
    );
  }
}

export const requestPasswordReset = validatedAction(
  requestPasswordResetSchema,
  async ({ email }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return { success: GENERIC_PASSWORD_RESET_MESSAGE };
    }

    const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000
    );

    try {
      await db.transaction(async (tx) => {
        await tx
          .delete(passwordResetTokens)
          .where(eq(passwordResetTokens.userId, user.id));
        await tx.insert(passwordResetTokens).values({
          userId: user.id,
          tokenHash,
          expiresAt
        });
      });

      await sendPasswordResetEmail(email, token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[password-reset] Failed to process password reset request:', {
        email,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        // Log which email service was attempted
        resendConfigured: !!process.env.RESEND_API_KEY,
        nodeEnv: process.env.NODE_ENV
      });
      
      // Provide more specific error message if it's a configuration issue
      if (errorMessage.includes('Email service not configured')) {
        return {
          error: 'Email service is not configured. Please contact support.',
          email
        };
      }
      
      return {
        error:
          'We were unable to send the reset email. Please try again in a few minutes.',
        email
      };
    }

    return { success: GENERIC_PASSWORD_RESET_MESSAGE };
  }
);

export const resetPassword = validatedAction(
  resetPasswordSchema,
  async ({ token, password }) => {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const [storedToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);

    if (
      !storedToken ||
      storedToken.usedAt ||
      new Date(storedToken.expiresAt) < new Date()
    ) {
      return { error: 'This reset link is invalid or has expired.' };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, storedToken.userId))
      .limit(1);

    if (!user) {
      return { error: 'This reset link is invalid or has expired.' };
    }

    const newPasswordHash = await hashPassword(password);

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, storedToken.id));

      await tx
        .delete(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.userId, user.id),
            ne(passwordResetTokens.id, storedToken.id)
          )
        );
    });

    return {
      success: 'Your password has been updated. You can now sign in.'
    };
  }
);

export async function signOut() {
  (await cookies()).delete('session');
  redirect('/sign-in');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword } = data;

    const isValidPassword = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      return { error: 'Current password is incorrect.' };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, user.id));

    return { success: 'Password updated successfully.' };
  }
);

const initiateDeleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required')
});

// First step: Validate password and redirect to confirmation page
export const initiateDeleteAccount = validatedActionWithUser(
  initiateDeleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isValidPassword = await comparePasswords(password, user.passwordHash);
    if (!isValidPassword) {
      return { error: 'Incorrect password. Please try again.' };
    }

    // Password is valid, redirect to confirmation page
    redirect('/dashboard/account/delete-confirm');
  }
);

const deleteAccountSchema = z.object({
  feedback: z.string().optional(), // Optional feedback
});

// Second step: Actually delete the account (soft delete)
export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    // Check if user is already deleted
    if (user.deletedAt) {
      (await cookies()).delete('session');
      redirect('/sign-in');
    }

    // Soft delete: Mark account as deleted instead of hard deleting
    await db.update(users).set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    // Send goodbye email
    try {
      const { subject, html } = getGoodbyeEmail({
        name: user.name,
        email: user.email,
        reason: 'account_deleted',
        planName: user.planName || undefined,
        location: user.location || undefined,
      });
      await sendEmail({
        to: user.email,
        subject,
        html,
      });
    } catch (emailError) {
      // Log error but don't fail account deletion
      console.error('Failed to send goodbye email:', emailError);
    }

    // Add to "Deleted Users" segment in Resend (will be fully removed after 30 days)
    try {
      const { addUserToDeletedUsersSegment } = await import('@/lib/emails/service');
      const metadata: Record<string, string> = {
        user_id: user.id.toString(),
        account_deleted_at: new Date().toISOString(),
        ...(user.location && { location: user.location }),
        ...(user.planName && { plan_name: user.planName }),
        ...(user.subscriptionStatus && { subscription_status: user.subscriptionStatus }),
      };
      await addUserToDeletedUsersSegment(user.email, user.name, metadata);
    } catch (resendError) {
      // Log error but don't fail account deletion
      console.error('[deleteAccount] Failed to add to Deleted Users segment:', resendError);
    }

    // If feedback was provided, submit it via Resend API directly
    if (data.feedback && data.feedback.trim().length > 0) {
      try {
        const { Resend } = await import('resend');
        const resendApiKey = process.env.RESEND_API_KEY;
        const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const feedbackRecipientEmail = process.env.FEEDBACK_RECIPIENT_EMAIL || resendFromEmail;

        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: resendFromEmail,
            to: feedbackRecipientEmail,
            replyTo: user.email,
            subject: 'TeacherTab Feedback: Account Deleted',
            html: `
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
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Received from TeacherTab account deletion confirmation</p>
                  </div>
                  
                  <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Name:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${user.name || 'User'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${user.email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #374151;">Reason:</td>
                        <td style="padding: 8px 0; color: #1f2937;">Account Deleted</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #374151; vertical-align: top;">Feedback:</td>
                        <td style="padding: 8px 0; color: #1f2937; white-space: pre-wrap;">${data.feedback}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; font-size: 14px; color: #92400e;">
                      <strong>Note:</strong> This feedback was submitted during account deletion.
                    </p>
                  </div>
                </body>
              </html>
            `,
          });
        }
      } catch (feedbackError) {
        console.error('[deleteAccount] Error submitting feedback:', feedbackError);
      }
    }

    // Clear session and redirect
    (await cookies()).delete('session');
    redirect('/sign-in?deleted=true');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  location: z.enum(['UK', 'US', 'Other'])
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email, location } = data;

    const updatedUser = await db.update(users).set({ 
      name, 
      email, 
      location
    }).where(eq(users.id, user.id)).returning();

    // Send user info to Resend for admin tracking
    if (updatedUser.length > 0) {
      try {
        await sendUserInfoToResend(updatedUser[0], 'profile_update');
      } catch (error) {
        // Log error but don't fail the account update
        console.error('[updateAccount] Failed to send user info to Resend:', error);
      }
    }

    return { name, success: 'Account updated successfully.' };
  }
);

const updateMarketingEmailsSchema = z.object({
  marketingEmails: z.string().transform((val) => val === 'true' || val === 'on'),
});

export const updateMarketingEmails = validatedActionWithUser(
  updateMarketingEmailsSchema,
  async (data, _, user) => {
    const { marketingEmails } = data;

    const updatedUser = await db.update(users).set({
      marketingEmails: marketingEmails ? 1 : 0, // Convert boolean to integer
      updatedAt: new Date(),
    }).where(eq(users.id, user.id)).returning();

    // Sync the change to Resend
    if (updatedUser.length > 0) {
      try {
        await sendUserInfoToResend(updatedUser[0], 'profile_update');
      } catch (error) {
        // Log error but don't fail the update
        console.error('[updateMarketingEmails] Failed to sync to Resend:', error);
      }
    }

    return {
      success: marketingEmails
        ? 'You are now subscribed to marketing emails.'
        : 'You have been unsubscribed from marketing emails. You will still receive important account-related emails.',
    };
  }
);

const updateTimetableSettingsSchema = z.object({
  teachingPhase: z.string().min(1, 'Teaching phase is required'),
  colorPreference: z.enum(['class', 'subject']),
  timetableCycle: z.enum(['weekly', '2-weekly']),
});

export const updateTimetableSettings = validatedActionWithUser(
  updateTimetableSettingsSchema,
  async (data, _, user) => {
    const { teachingPhase, colorPreference, timetableCycle } = data;

    const updatedUser = await db.update(users).set({ 
      teachingPhase, 
      colorPreference,
      timetableCycle,
    }).where(eq(users.id, user.id)).returning();

    // Send user info to Resend for admin tracking
    if (updatedUser.length > 0) {
      try {
        await sendUserInfoToResend(updatedUser[0], 'profile_update');
      } catch (error) {
        // Log error but don't fail the settings update
        console.error('[updateTimetableSettings] Failed to send user info to Resend:', error);
      }
    }

    return { success: 'Timetable settings updated successfully.' };
  }
);

export const resendWelcomeEmail = validatedActionWithUser(
  z.object({}),
  async (_, __, user) => {
    try {
      const { subject, html } = getWelcomeEmail({
        name: user.name,
        email: user.email,
        planName: user.planName || undefined,
        location: user.location || undefined,
      });

      await sendEmail({
        to: user.email,
        subject,
        html,
      });

      return { success: 'Welcome email sent successfully!' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `Failed to send email: ${errorMessage}` };
    }
  }
);
