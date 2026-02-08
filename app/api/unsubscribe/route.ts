import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { removeContactFromResendAudience, sendUserInfoToResend } from '@/lib/emails/service';

/**
 * Unsubscribe endpoint
 * GET /api/unsubscribe?email=user@example.com&token=optional_token
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email address is required' },
      { status: 400 }
    );
  }

  try {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // User doesn't exist, but we'll still show success message for privacy
      return NextResponse.redirect(
        new URL(`/unsubscribe?success=true&email=${encodeURIComponent(email)}`, request.url)
      );
    }

    // Update user's marketing emails preference
    const [updatedUser] = await db
      .update(users)
      .set({
        marketingEmails: 0, // 0 = unsubscribed
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    // Sync the change to Resend (this will remove them from audience or mark as unsubscribed)
    if (updatedUser) {
      try {
        await sendUserInfoToResend(updatedUser, 'profile_update');
      } catch (resendError) {
        // Log error but don't fail the unsubscribe
        console.error('[unsubscribe] Failed to sync to Resend:', resendError);
      }
    }

    // Redirect to confirmation page
    return NextResponse.redirect(
      new URL(`/unsubscribe?success=true&email=${encodeURIComponent(email)}`, request.url)
    );
  } catch (error) {
    console.error('[unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for programmatic unsubscribe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: true, message: 'Unsubscribed' });
    }

    // Update user's marketing emails preference
    const [updatedUser] = await db
      .update(users)
      .set({
        marketingEmails: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    // Sync the change to Resend (this will remove them from audience or mark as unsubscribed)
    if (updatedUser) {
      try {
        await sendUserInfoToResend(updatedUser, 'profile_update');
      } catch (resendError) {
        console.error('[unsubscribe] Failed to sync to Resend:', resendError);
      }
    }

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('[unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}

