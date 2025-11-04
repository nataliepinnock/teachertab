import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, type NewUser } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  let session: Stripe.Checkout.Session | null = null;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription', 'line_items'],
    });

    // Check payment status first - if payment failed or unpaid, redirect immediately
    if (session.payment_status !== 'paid') {
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

    if (flow === 'signup') {
      // Create new user from signup data in metadata
      const signupName = session.metadata?.signupName;
      const signupEmail = session.metadata?.signupEmail;
      const signupPasswordHash = session.metadata?.signupPasswordHash;
      const signupTeacherType = session.metadata?.signupTeacherType;
      const signupTimetableCycle = session.metadata?.signupTimetableCycle;

      if (!signupName || !signupEmail || !signupPasswordHash || !signupTeacherType || !signupTimetableCycle) {
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
        await db
          .update(users)
          .set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeProductId: productId,
            planName: (plan.product as Stripe.Product).name,
            subscriptionStatus: subscription.status,
          })
          .where(eq(users.id, existingUser.id));

        await setSession(existingUser);
      } else {
        // Create new user
        const newUser: NewUser = {
          name: signupName,
          email: signupEmail,
          passwordHash: signupPasswordHash,
          teacherType: signupTeacherType,
          timetableCycle: signupTimetableCycle,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeProductId: productId,
          planName: (plan.product as Stripe.Product).name,
          subscriptionStatus: subscription.status,
        };

        const [createdUser] = await db.insert(users).values(newUser).returning();

        if (!createdUser) {
          throw new Error('Failed to create user account.');
        }

        await setSession(createdUser);
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

      await db
        .update(users)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeProductId: productId,
          planName: (plan.product as Stripe.Product).name,
          subscriptionStatus: subscription.status,
        })
        .where(eq(users.id, user[0].id));

      await setSession(user[0]);
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error handling checkout:', error);

    // Default to pricing page
    let redirectUrl = new URL('/pricing', request.url);
    redirectUrl.searchParams.set('checkout', 'failed');

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
