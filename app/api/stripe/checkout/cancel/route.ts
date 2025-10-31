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
    return;
  }

  const userId = Number(userIdRaw);

  if (Number.isNaN(userId)) {
    return;
  }

  await deleteUserIfNoSubscription(userId);
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(buildRedirectUrl(request));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer']
    });

    await cleanupSignupIfNeeded(session);
  } catch (error) {
    console.error('Error handling checkout cancellation:', error);
  }

  return NextResponse.redirect(buildRedirectUrl(request, 'checkout=cancelled'));
}

