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

    // Get all prices for each product, then organize by currency and interval
    const monthlyPrices = prices.filter((price) => price.productId === monthlyPlan?.id);
    const annualPrices = prices.filter((price) => price.productId === annualPlan?.id);

    // Helper function to find price by currency and interval from a list of prices
    const findPrice = (priceList: typeof prices, currency: string, interval: string) => {
      return priceList.find(
        (price) =>
          price.currency.toLowerCase() === currency.toLowerCase() &&
          price.interval === interval
      );
    };

    // Get prices for all currencies
    const gbpMonthly = findPrice(monthlyPrices, 'gbp', 'month');
    const gbpAnnual = findPrice(annualPrices, 'gbp', 'year');
    const usdMonthly = findPrice(monthlyPrices, 'usd', 'month');
    const usdAnnual = findPrice(annualPrices, 'usd', 'year');
    const eurMonthly = findPrice(monthlyPrices, 'eur', 'month');
    const eurAnnual = findPrice(annualPrices, 'eur', 'year');

    // Debug logging
    console.log('Monthly product ID:', monthlyPlan?.id);
    console.log('Annual product ID:', annualPlan?.id);
    console.log('Monthly prices found:', monthlyPrices.length);
    console.log('Annual prices found:', annualPrices.length);
    console.log('Monthly prices:', monthlyPrices.map(p => ({ currency: p.currency, interval: p.interval, amount: p.unitAmount })));
    console.log('Annual prices:', annualPrices.map(p => ({ currency: p.currency, interval: p.interval, amount: p.unitAmount })));

    const response = {
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
      // Include debug info (can be removed later)
      _debug: {
        monthlyProductId: monthlyPlan?.id,
        annualProductId: annualPlan?.id,
        monthlyPricesCount: monthlyPrices.length,
        annualPricesCount: annualPrices.length,
        monthlyPrices: monthlyPrices.map(p => ({
          id: p.id,
          currency: p.currency,
          interval: p.interval,
          amount: p.unitAmount
        })),
        annualPrices: annualPrices.map(p => ({
          id: p.id,
          currency: p.currency,
          interval: p.interval,
          amount: p.unitAmount
        })),
        foundPrices: {
          gbpMonthly: gbpMonthly ? { id: gbpMonthly.id, amount: gbpMonthly.unitAmount } : null,
          gbpAnnual: gbpAnnual ? { id: gbpAnnual.id, amount: gbpAnnual.unitAmount } : null,
          usdMonthly: usdMonthly ? { id: usdMonthly.id, amount: usdMonthly.unitAmount } : null,
          usdAnnual: usdAnnual ? { id: usdAnnual.id, amount: usdAnnual.unitAmount } : null,
          eurMonthly: eurMonthly ? { id: eurMonthly.id, amount: eurMonthly.unitAmount } : null,
          eurAnnual: eurAnnual ? { id: eurAnnual.id, amount: eurAnnual.unitAmount } : null,
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

