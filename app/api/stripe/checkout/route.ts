import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
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

    if (!session.customer || typeof session.customer === 'string') {
      throw new Error('Invalid customer data from Stripe.');
    }

    const customerId = session.customer.id;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
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
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error handling successful checkout:', error);

    let redirectUrl = new URL('/pricing', request.url);
    redirectUrl.searchParams.set('checkout', 'failed');

    let fallbackSession = session;

    if (!fallbackSession) {
      try {
        fallbackSession = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items'],
        });
      } catch (sessionError) {
        console.error('Error retrieving failed checkout session:', sessionError);
      }
    }

    const priceId = fallbackSession?.metadata?.priceId ||
      (fallbackSession?.line_items?.data?.[0]?.price as Stripe.Price | undefined)?.id;
    const flow = fallbackSession?.metadata?.flow;

    if (flow === 'signup') {
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
