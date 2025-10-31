import Stripe from 'stripe';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { deleteUserIfNoSubscription } from '@/lib/db/queries';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed':
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.flow === 'signup' && session.client_reference_id) {
        const userId = Number(session.client_reference_id);
        if (!Number.isNaN(userId)) {
          const deleted = await deleteUserIfNoSubscription(userId);
          console.log('Webhook cleanup', {
            eventType: event.type,
            sessionId: session.id,
            userId,
            deleted
          });
        } else {
          console.warn('Webhook cleanup skipped: invalid user id', {
            eventType: event.type,
            raw: session.client_reference_id
          });
        }
      } else {
        console.log('Webhook cleanup skipped: not signup flow or missing user', {
          eventType: event.type,
          metadata: session.metadata,
          clientReferenceId: session.client_reference_id
        });
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
