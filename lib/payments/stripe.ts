                                                                                                              import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { User } from '@/lib/db/schema';
import {
  getUserByStripeCustomerId,
  getUser,
  updateUserSubscription
} from '@/lib/db/queries';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(stripeSecretKey);

const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

type CheckoutSessionContext = 'signup' | 'existing';

type SignupData = {
  name: string;
  email: string;
  passwordHash: string;
  teacherType: string;
  timetableCycle: string;
};

export async function createCheckoutSession({
  user,
  priceId,
  context = 'existing',
  signupData
}: {
  user: User | null;
  priceId: string;
  context?: CheckoutSessionContext;
  signupData?: SignupData;
}) {
  const currentUser = await getUser();

  if (context === 'signup') {
    // For signup, user is null and we use signupData
    if (!signupData) {
      redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
    }
    // If someone is already logged in, sign them out first
    if (currentUser) {
      redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
    }
  } else {
    // For existing users, user must be provided
    if (!user) {
      redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
    }

    if (!currentUser || currentUser.id !== user.id) {
      redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
    }
  }

  const metadata: Record<string, string> = {
    flow: context,
    priceId
  };

  // Store signup data in metadata for signup flow
  if (context === 'signup' && signupData) {
    metadata.signupName = signupData.name;
    metadata.signupEmail = signupData.email;
    metadata.signupPasswordHash = signupData.passwordHash;
    metadata.signupTeacherType = signupData.teacherType;
    metadata.signupTimetableCycle = signupData.timetableCycle;
  }

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

  redirect(session.url!);
}

export async function createCustomerPortalSession(user: User) {
  if (!user.stripeCustomerId || !user.stripeProductId) {
    redirect('/pricing');
  }

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    const product = await stripe.products.retrieve(user.stripeProductId);
    if (!product.active) {
      throw new Error("User's product is not active in Stripe");
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true
    });
    if (prices.data.length === 0) {
      throw new Error("No active prices found for the user's product");
    }

    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your subscription'
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'create_prorations',
          products: [
            {
              product: product.id,
              prices: prices.data.map((price) => price.id)
            }
          ]
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other'
            ]
          }
        },
        payment_method_update: {
          enabled: true
        }
      }
    });
  }

  return stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appBaseUrl}/dashboard`,
    configuration: configuration.id
  });
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    await updateUserSubscription(user.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      planName: (plan?.product as Stripe.Product).name,
      subscriptionStatus: status
    });
  } else if (status === 'canceled' || status === 'unpaid') {
    await updateUserSubscription(user.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status
    });
  }
}

export async function getStripePrices() {
  // Query ALL prices (no filters) to see everything that exists
  const allPricesResponse = await stripe.prices.list({
    expand: ['data.product', 'data.currency_options'],
    limit: 100 // Get up to 100 prices
  });

  // Also try to get prices for the specific products we know about
  // This helps if prices are linked differently
  const monthlyProductId = 'prod_TKUx0QJx33pMnN';
  const annualProductId = 'prod_TKUxYvCGdybfX9';
  
  const monthlyProductPrices = await stripe.prices.list({
    expand: ['data.product', 'data.currency_options'],
    limit: 100
  });
  
  const annualProductPrices = await stripe.prices.list({
    expand: ['data.product', 'data.currency_options'],
    limit: 100
  });
  
  // Combine all results
  const allPricesData = [
    ...allPricesResponse.data,
    ...monthlyProductPrices.data,
    ...annualProductPrices.data
  ];

  // Filter to only recurring prices and remove duplicates
  const seenPriceIds = new Set<string>();
  const allPriceData = allPricesData.filter((price) => {
    // Only include recurring prices
    if (price.type !== 'recurring') return false;
    // Remove duplicates
    if (seenPriceIds.has(price.id)) return false;
    seenPriceIds.add(price.id);
    return true;
  });

  const allPrices: Array<{
    id: string;
    productId: string;
    unitAmount: number;
    currency: string;
    interval: string | undefined;
    trialPeriodDays: number | undefined;
    active: boolean;
  }> = [];

  // Process each price and extract currency variants
  allPriceData.forEach((price) => {
    const productId = typeof price.product === 'string' ? price.product : price.product.id;
    
    // Add the default currency price
    allPrices.push({
      id: price.id,
      productId,
      unitAmount: price.unit_amount || 0,
      currency: price.currency,
      interval: price.recurring?.interval,
      trialPeriodDays: price.recurring?.trial_period_days ?? undefined,
      active: price.active
    });

    // Check for currency_options (multi-currency pricing)
    // In Stripe, currency_options contains additional currencies for the same price
    if (price.currency_options && typeof price.currency_options === 'object') {
      Object.entries(price.currency_options).forEach(([currency, options]: [string, any]) => {
        if (options && typeof options === 'object' && 'unit_amount' in options) {
          allPrices.push({
            id: price.id, // Same price ID, different currency
            productId,
            unitAmount: options.unit_amount || 0,
            currency: currency.toLowerCase(),
            interval: price.recurring?.interval,
            trialPeriodDays: price.recurring?.trial_period_days ?? undefined,
            active: price.active
          });
        }
      });
    }
  });

  return allPrices;
}

export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price']
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id
  }));
}
