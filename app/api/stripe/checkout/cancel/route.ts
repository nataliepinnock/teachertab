import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import Stripe from 'stripe';
import { deleteUserIfNoSubscription } from '@/lib/db/queries';

function buildRedirectUrl(request: NextRequest, search = '') {
  const url = new URL('/pricing', request.url);
  if (search) {
    url.search = search;
  }
  return url;
}

async function cleanupSignupIfNeeded(session: Stripe.Checkout.Session) {
  const flow = session.metadata?.flow;
  const userIdRaw = session.client_reference_id;

  if (flow !== 'signup' || !userIdRaw) {
    console.log('Checkout cancel: flow not signup or missing user', {
      flow,
      userIdRaw
    });
    return;
  }

  const userId = Number(userIdRaw);

  if (Number.isNaN(userId)) {
    console.warn('Checkout cancel: invalid user id', { userIdRaw });
    return;
  }

  const deleted = await deleteUserIfNoSubscription(userId);
  console.log('Checkout cancel cleanup result', {
    sessionId: session.id,
    userId,
    deleted
  });
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(buildRedirectUrl(request));
  }

  let redirectUrl = buildRedirectUrl(request, 'checkout=cancelled');

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'line_items']
    });

    await cleanupSignupIfNeeded(session);

    if (session.metadata?.flow === 'signup') {
      const url = new URL('/sign-up', request.url);
      url.searchParams.set('redirect', 'checkout');
      url.searchParams.set('checkout', 'cancelled');

      const priceId = session.metadata?.priceId ||
        (session.line_items?.data?.[0]?.price as Stripe.Price | undefined)?.id;
      if (priceId) {
        url.searchParams.set('priceId', priceId);
      }

      redirectUrl = url;
    }
  } catch (error) {
    console.error('Error handling checkout cancellation:', error);
  }

  return NextResponse.redirect(redirectUrl);
}

