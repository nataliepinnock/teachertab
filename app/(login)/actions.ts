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
  teacherType: z.enum(['primary', 'secondary']),
  timetableCycle: z.enum(['weekly', '2-weekly'])
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { name, email, password, teacherType, timetableCycle } = data;

  const redirectIntent = formData.get('redirect') as string | null;
  const selectedPriceId = formData.get('priceId') as string | null;

  if (!selectedPriceId) {
    return {
      error: 'Please select a subscription plan to continue.',
      name,
      email
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
    // Create checkout session with signup data in metadata (no user account yet)
    return createCheckoutSession({
      user: null,
      priceId: selectedPriceId,
      context: 'signup',
      signupData: {
        name,
        email,
        passwordHash,
        teacherType: teacherType as string,
        timetableCycle: timetableCycle as string
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

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL;

  if (resendApiKey && resendFrom) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: resendFrom,
        to: email,
        subject: 'Reset your TeacherTab password',
        html: `
          <p>Hello,</p>
          <p>We received a request to reset your TeacherTab password. Click the link below to set a new password. This link will expire in ${PASSWORD_RESET_EXPIRY_MINUTES} minutes.</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send password reset email: ${response.status} ${errorText}`
      );
    }
  } else {
    console.info(
      `[password-reset] Generated link for ${email}: ${resetLink}`
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
      console.error('Failed to generate password reset token', error);
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

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required')
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isValidPassword = await comparePasswords(password, user.passwordHash);
    if (!isValidPassword) {
      return { error: 'Incorrect password. Account deletion failed.' };
    }

    // Delete the user account
    await db.delete(users).where(eq(users.id, user.id));

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  teacherType: z.enum(['primary', 'secondary']),
  timetableCycle: z.enum(['weekly', '2-weekly'])
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email, teacherType, timetableCycle } = data;

    await db.update(users).set({ 
      name, 
      email, 
      teacherType, 
      timetableCycle 
    }).where(eq(users.id, user.id));

    return { name, success: 'Account updated successfully.' };
  }
);
