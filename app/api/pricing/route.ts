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

    // Helper function to find price by product, currency, and interval
    const findPrice = (productId: string | undefined, currency: string, interval: string) => {
      return prices.find(
        (price) =>
          price.productId === productId &&
          price.currency.toLowerCase() === currency.toLowerCase() &&
          price.interval === interval
      );
    };

    // Get prices for all currencies
    const gbpMonthly = findPrice(monthlyPlan?.id, 'gbp', 'month');
    const gbpAnnual = findPrice(annualPlan?.id, 'gbp', 'year');
    const usdMonthly = findPrice(monthlyPlan?.id, 'usd', 'month');
    const usdAnnual = findPrice(annualPlan?.id, 'usd', 'year');
    const eurMonthly = findPrice(monthlyPlan?.id, 'eur', 'month');
    const eurAnnual = findPrice(annualPlan?.id, 'eur', 'year');

    return NextResponse.json({
      gbp: {
        monthly: {
          name: monthlyPlan?.name || 'Monthly',
          price: gbpMonthly?.unitAmount || 0,
          currency: 'gbp',
          interval: gbpMonthly?.interval || 'month',
          trialDays: gbpMonthly?.trialPeriodDays || 0,
          priceId: gbpMonthly?.id,
        },
        annual: {
          name: annualPlan?.name || 'Annual',
          price: gbpAnnual?.unitAmount || 0,
          currency: 'gbp',
          interval: gbpAnnual?.interval || 'year',
          trialDays: gbpAnnual?.trialPeriodDays || 0,
          priceId: gbpAnnual?.id,
        },
      },
      usd: {
        monthly: {
          name: monthlyPlan?.name || 'Monthly',
          price: usdMonthly?.unitAmount || 0,
          currency: 'usd',
          interval: usdMonthly?.interval || 'month',
          trialDays: usdMonthly?.trialPeriodDays || 0,
          priceId: usdMonthly?.id,
        },
        annual: {
          name: annualPlan?.name || 'Annual',
          price: usdAnnual?.unitAmount || 0,
          currency: 'usd',
          interval: usdAnnual?.interval || 'year',
          trialDays: usdAnnual?.trialPeriodDays || 0,
          priceId: usdAnnual?.id,
        },
      },
      eur: {
        monthly: {
          name: monthlyPlan?.name || 'Monthly',
          price: eurMonthly?.unitAmount || 0,
          currency: 'eur',
          interval: eurMonthly?.interval || 'month',
          trialDays: eurMonthly?.trialPeriodDays || 0,
          priceId: eurMonthly?.id,
        },
        annual: {
          name: annualPlan?.name || 'Annual',
          price: eurAnnual?.unitAmount || 0,
          currency: 'eur',
          interval: eurAnnual?.interval || 'year',
          trialDays: eurAnnual?.trialPeriodDays || 0,
          priceId: eurAnnual?.id,
        },
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

