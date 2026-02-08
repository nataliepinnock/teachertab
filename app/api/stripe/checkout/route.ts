import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, type NewUser } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import Stripe from 'stripe';
import { sendEmail, sendUserInfoToResend } from '@/lib/emails/service';
import { getWelcomeEmail } from '@/lib/emails/templates';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  console.log('[checkout] Checkout route called:', {
    sessionId,
    url: request.url,
    searchParams: Object.fromEntries(searchParams.entries()),
  });

  if (!sessionId) {
    console.error('[checkout] No session_id provided');
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  let session: Stripe.Checkout.Session | null = null;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription', 'line_items'],
    });

    console.log('[checkout] Session retrieved:', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
      flow: session.metadata?.flow,
      hasCustomer: !!session.customer,
      hasSubscription: !!session.subscription,
    });

    // Check session status first - if not complete, payment hasn't finished
    if (session.status !== 'complete') {
      console.error('[checkout] Session not complete:', {
        sessionStatus: session.status,
        paymentStatus: session.payment_status,
      });
      throw new Error(`Checkout session status: ${session.status}`);
    }

    // Check payment status - for subscriptions, this should be 'paid' when complete
    // Note: For subscriptions, payment_status might be 'paid' or 'unpaid' initially
    // 'unpaid' can occur if payment requires action (3D Secure, etc.)
    if (session.payment_status !== 'paid') {
      console.error('[checkout] Payment not paid:', {
        paymentStatus: session.payment_status,
        sessionStatus: session.status,
        paymentIntent: session.payment_intent,
      });
      throw new Error(`Payment status: ${session.payment_status}`);
    }

    if (!session.customer || typeof session.customer === 'string') {
      throw new Error('Invalid customer data from Stripe.');
    }

    const customerId = session.customer.id;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      // If no subscription, payment likely failed - redirect to signup/pricing
      throw new Error('No subscription found for this session.');
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const plan = subscription.items.data[0]?.price;

    if (!plan) {
      throw new Error('No plan found for this subscription.');
    }

    const productId = (plan.product as Stripe.Product).id;

    if (!productId) {
      throw new Error('No product ID found for this subscription.');
    }

    const flow = session.metadata?.flow;

    console.log('[checkout] Processing flow:', flow);

    if (flow === 'signup') {
      // Create new user from signup data in metadata
      const signupName = session.metadata?.signupName;
      const signupEmail = session.metadata?.signupEmail;
      const signupPasswordHash = session.metadata?.signupPasswordHash;
      const signupTeachingPhase = session.metadata?.signupTeachingPhase;
      const signupColorPreference = session.metadata?.signupColorPreference;
      const signupTimetableCycle = session.metadata?.signupTimetableCycle;
      const signupLocation = session.metadata?.signupLocation || 'UK'; // Default to UK if not provided
      const signupMarketingEmails = session.metadata?.signupMarketingEmails === 'true' || session.metadata?.signupMarketingEmails === undefined; // Default to true (subscribed) if not specified

      console.log('[checkout] Signup data:', {
        hasName: !!signupName,
        hasEmail: !!signupEmail,
        hasPasswordHash: !!signupPasswordHash,
        hasTeachingPhase: !!signupTeachingPhase,
        hasColorPreference: !!signupColorPreference,
        hasTimetableCycle: !!signupTimetableCycle,
        email: signupEmail,
      });

      if (!signupName || !signupEmail || !signupPasswordHash || !signupTeachingPhase || !signupColorPreference || !signupTimetableCycle) {
        console.error('[checkout] Missing signup data:', {
          signupName: !!signupName,
          signupEmail: !!signupEmail,
          signupPasswordHash: !!signupPasswordHash,
          signupTeachingPhase: !!signupTeachingPhase,
          signupColorPreference: !!signupColorPreference,
          signupTimetableCycle: !!signupTimetableCycle,
        });
        throw new Error('Missing signup data in session metadata.');
      }

      // Check if user already exists (shouldn't happen, but safety check)
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, signupEmail))
        .limit(1);

      if (existingUser) {
        // User exists, update their subscription
        const [updatedUser] = await db
          .update(users)
          .set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeProductId: productId,
            planName: (plan.product as Stripe.Product).name,
            subscriptionStatus: subscription.status,
          })
          .where(eq(users.id, existingUser.id))
          .returning();

        await setSession(existingUser);

        // Sync subscription change to Resend
        if (updatedUser) {
          try {
            await sendUserInfoToResend(updatedUser, 'subscription_change');
          } catch (error) {
            console.error('[checkout] Failed to send user info to Resend:', error);
          }
        }
      } else {
        // Create new user
        console.log('[checkout] Creating new user in database...');
        const newUser: NewUser = {
          name: signupName,
          email: signupEmail,
          passwordHash: signupPasswordHash,
          teachingPhase: signupTeachingPhase,
          colorPreference: signupColorPreference,
          timetableCycle: signupTimetableCycle,
          location: signupLocation,
          marketingEmails: signupMarketingEmails ? 1 : 0, // 1 = subscribed, 0 = unsubscribed
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeProductId: productId,
          planName: (plan.product as Stripe.Product).name,
          subscriptionStatus: subscription.status,
        };

        const [createdUser] = await db.insert(users).values(newUser).returning();

        if (!createdUser) {
          console.error('[checkout] Failed to create user - no user returned from insert');
          throw new Error('Failed to create user account.');
        }

        console.log('[checkout] User created successfully:', {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
        });

        await setSession(createdUser);

        // Send welcome email for new sign-ups
        if (flow === 'signup') {
          try {
            const { subject, html } = getWelcomeEmail({
              name: createdUser.name,
              email: createdUser.email,
              planName: createdUser.planName || undefined,
              location: createdUser.location || undefined,
            });
            await sendEmail({
              to: createdUser.email,
              subject,
              html,
            });
          } catch (emailError) {
            // Log error but don't fail the signup process
            // Email sending failures shouldn't block user registration
          }

          // Send user info to Resend for admin tracking and add to audience
          try {
            console.log('[checkout] Adding user to Resend Audience:', {
              email: createdUser.email,
              name: createdUser.name,
              marketingEmails: createdUser.marketingEmails,
            });
            await sendUserInfoToResend(createdUser, 'signup');
            console.log('[checkout] Successfully added user to Resend Audience');
          } catch (error) {
            // Log error but don't fail the signup process
            console.error('[checkout] Failed to send user info to Resend:', {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              email: createdUser.email,
            });
          }
        }

        // Redirect new users to setup page with welcome flag
        return NextResponse.redirect(new URL('/dashboard/setup?welcome=true', request.url));
      }
    } else {
      // Existing user flow - update subscription
      const userId = session.client_reference_id;
      if (!userId) {
        throw new Error("No user ID found in session's client_reference_id.");
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(userId)))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found in database.');
      }

      const updatedUser = await db
        .update(users)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeProductId: productId,
          planName: (plan.product as Stripe.Product).name,
          subscriptionStatus: subscription.status,
        })
        .where(eq(users.id, user[0].id))
        .returning();

      await setSession(user[0]);

      // Send user info to Resend for admin tracking (subscription change)
      if (updatedUser.length > 0) {
        try {
          await sendUserInfoToResend(updatedUser[0], 'subscription_change');
        } catch (error) {
          // Log error but don't fail the subscription update
          console.error('[checkout] Failed to send user info to Resend:', error);
        }
      }
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[checkout] Error handling checkout:', {
      error: errorMessage,
      stack: errorStack,
      sessionId,
      sessionStatus: session?.status,
      paymentStatus: session?.payment_status,
      flow: session?.metadata?.flow,
    });

    // Default to pricing page
    let redirectUrl = new URL('/pricing', request.url);
    redirectUrl.searchParams.set('checkout', 'failed');
    redirectUrl.searchParams.set('error', encodeURIComponent(errorMessage));

    // Try to get session info for better redirect
    let fallbackSession = session;

    if (!fallbackSession && sessionId) {
      try {
        fallbackSession = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items'],
        });
      } catch (sessionError) {
        console.error('Error retrieving failed checkout session:', sessionError);
        // If we can't retrieve session, just redirect to signup as fallback
        redirectUrl = new URL('/sign-up', request.url);
        redirectUrl.searchParams.set('redirect', 'checkout');
        redirectUrl.searchParams.set('checkout', 'failed');
        return NextResponse.redirect(redirectUrl);
      }
    }

    const priceId = fallbackSession?.metadata?.priceId ||
      (fallbackSession?.line_items?.data?.[0]?.price as Stripe.Price | undefined)?.id;
    const flow = fallbackSession?.metadata?.flow;

    // Always redirect to signup if it was a signup flow, otherwise pricing
    if (flow === 'signup' || !fallbackSession) {
      redirectUrl = new URL('/sign-up', request.url);
      redirectUrl.searchParams.set('redirect', 'checkout');
      redirectUrl.searchParams.set('checkout', 'failed');
      if (priceId) {
        redirectUrl.searchParams.set('priceId', priceId);
      }
    }

    return NextResponse.redirect(redirectUrl);
  }
}
