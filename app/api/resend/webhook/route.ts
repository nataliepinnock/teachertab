import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendUserInfoToResend } from '@/lib/emails/service';

/**
 * Resend webhook handler for unsubscribe events
 * Configure this URL in Resend dashboard: https://yourdomain.com/api/resend/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Handle unsubscribe events from Resend
    if (type === 'contact.unsubscribed' || type === 'email.unsubscribed') {
      const email = data?.email || data?.recipient;

      if (!email) {
        console.warn('[resend-webhook] No email in unsubscribe event:', body);
        return NextResponse.json({ received: true });
      }

      console.log(`[resend-webhook] Unsubscribe event for: ${email}`);

      // Find user by email and update marketing emails preference
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (user) {
          const [updatedUser] = await db
            .update(users)
            .set({
              marketingEmails: 0, // 0 = unsubscribed
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))
            .returning();

          console.log(`[resend-webhook] Updated user ${email} marketing preference to unsubscribed`);
          
          // Sync the change to Resend (this will mark them as unsubscribed, which they already are)
          // This ensures the DB and Resend stay in sync
          if (updatedUser) {
            try {
              await sendUserInfoToResend(updatedUser, 'profile_update');
            } catch (error) {
              console.error('[resend-webhook] Failed to sync to Resend:', error);
            }
          }
        } else {
          console.log(`[resend-webhook] User not found for email: ${email}`);
        }
      } catch (dbError) {
        console.error('[resend-webhook] Error updating user:', dbError);
        // Don't fail the webhook - Resend will retry
      }
    }

    // Handle other webhook events if needed
    // See: https://resend.com/docs/webhooks

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[resend-webhook] Error processing webhook:', error);
    // Return 200 to prevent Resend from retrying invalid requests
    return NextResponse.json({ received: true, error: 'Processing failed' }, { status: 200 });
  }
}

// Allow GET for webhook verification (some services ping the endpoint)
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

