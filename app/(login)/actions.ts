'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  users,
  type NewUser,
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
