import Stripe from 'stripe';
import { User } from '@/lib/db/schema';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(stripeSecretKey);

const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

type SignupData = {
  name: string;
  email: string;
  passwordHash: string;
  teachingPhase: string;
  colorPreference: string;
  timetableCycle: string;
  location: string;
  marketingEmails?: boolean;
};

/**
 * Creates a checkout session and returns the URL (for use in API routes)
 * This is a version of createCheckoutSession that returns a URL instead of redirecting
 */
export async function createCheckoutSessionUrl({
  user,
  priceId,
  context = 'existing',
  signupData
}: {
  user: User | null;
  priceId: string;
  context?: 'signup' | 'existing';
  signupData?: SignupData;
}): Promise<string> {
  const metadata: Record<string, string> = {
    flow: context,
    priceId
  };

  // Store signup data in metadata for signup flow
  if (context === 'signup' && signupData) {
    metadata.signupName = signupData.name;
    metadata.signupEmail = signupData.email;
    metadata.signupPasswordHash = signupData.passwordHash;
    metadata.signupTeachingPhase = signupData.teachingPhase;
    metadata.signupColorPreference = signupData.colorPreference;
    metadata.signupTimetableCycle = signupData.timetableCycle;
    metadata.signupLocation = signupData.location;
    // Store marketingEmails preference (default to true/1 if not specified)
    metadata.signupMarketingEmails = (signupData.marketingEmails !== false).toString();
  }

  console.log('[checkout-helper] Creating checkout session:', {
    priceId,
    context,
    hasSignupData: !!signupData,
    signupEmail: signupData?.email,
    metadataKeys: Object.keys(metadata),
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${appBaseUrl}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl}/api/stripe/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
    customer: user?.stripeCustomerId || undefined,
    client_reference_id: user?.id.toString(),
    allow_promotion_codes: true,
    subscription_data: {
      // No trial period
    },
    metadata
  });

  console.log('[checkout-helper] Checkout session created:', {
    sessionId: session.id,
    url: session.url,
    status: session.status,
    paymentStatus: session.payment_status,
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return session.url;
}

