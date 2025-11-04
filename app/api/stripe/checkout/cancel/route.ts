import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  // Default redirect to signup page
  let redirectUrl = new URL('/sign-up', request.url);
  redirectUrl.searchParams.set('redirect', 'checkout');
  redirectUrl.searchParams.set('checkout', 'cancelled');

  if (!sessionId) {
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items']
    });

    // Get priceId from metadata or line items
    const priceId = session.metadata?.priceId ||
      (session.line_items?.data?.[0]?.price as Stripe.Price | undefined)?.id;

    if (priceId) {
      redirectUrl.searchParams.set('priceId', priceId);
    }

    // If it's not a signup flow, redirect to pricing instead
    if (session.metadata?.flow !== 'signup') {
      redirectUrl = new URL('/pricing', request.url);
      redirectUrl.searchParams.set('checkout', 'cancelled');
    }
  } catch (error) {
    console.error('Error handling checkout cancellation:', error);
    // Continue with default signup redirect on error
  }

  return NextResponse.redirect(redirectUrl);
}

