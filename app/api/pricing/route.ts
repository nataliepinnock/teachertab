import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { NextResponse } from 'next/server';

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    const [prices, products] = await Promise.all([
      getStripePrices(),
      getStripeProducts(),
    ]);

    const monthlyPlan = products.find((product) => product.name === 'Monthly');
    const annualPlan = products.find((product) => product.name === 'Annual');

    const monthlyPrice = prices.find((price) => price.productId === monthlyPlan?.id);
    const annualPrice = prices.find((price) => price.productId === annualPlan?.id);

    return NextResponse.json({
      monthly: {
        name: monthlyPlan?.name || 'Monthly',
        price: monthlyPrice?.unitAmount || 0,
        currency: monthlyPrice?.currency || 'gbp',
        interval: monthlyPrice?.interval || 'month',
        trialDays: monthlyPrice?.trialPeriodDays || 0,
        priceId: monthlyPrice?.id,
      },
      annual: {
        name: annualPlan?.name || 'Annual',
        price: annualPrice?.unitAmount || 0,
        currency: annualPrice?.currency || 'gbp',
        interval: annualPrice?.interval || 'year',
        trialDays: annualPrice?.trialPeriodDays || 0,
        priceId: annualPrice?.id,
      },
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

