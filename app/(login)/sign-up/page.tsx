import { Suspense } from 'react';
import { Login, type PlanOption } from '../login';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';

export const dynamic = 'force-dynamic';

export default async function SignUpPage({
  searchParams
}: {
  // Match Next 15 PageProps: searchParams can be a Promise
  searchParams?: Promise<any>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;

  const rawPriceId = resolvedParams?.priceId as string | string[] | undefined;
  const priceId = Array.isArray(rawPriceId) ? rawPriceId[0] : rawPriceId;

  let plans: PlanOption[] = [];

  try {
    const [prices, products] = await Promise.all([
      getStripePrices(),
      getStripeProducts()
    ]);

    plans = prices
      .filter((price): price is typeof price & { unitAmount: number; interval: string } => {
        // Type guard to ensure price has required fields
        return !!(
          price?.id &&
          price.unitAmount != null &&
          typeof price.unitAmount === 'number' &&
          price.interval &&
          typeof price.interval === 'string'
        );
      })
      .flatMap((price) => {
        const product = products.find((product) => product?.id === price.productId);

        // Ensure product exists and has required fields
        if (
          !product ||
          !product.id ||
          typeof product.name !== 'string' ||
          product.name.length === 0
        ) {
          return [];
        }

        // TypeScript now knows unitAmount and interval are not null
        const plan: PlanOption = {
          id: price.id,
          name: product.name,
          amount: price.unitAmount,
          interval: price.interval as PlanOption['interval'],
          description: product.description ?? null
        };

        return [plan];
      })
      .filter((plan): plan is PlanOption => {
        // Final validation to ensure plan is complete
        return !!(
          plan &&
          plan.id &&
          typeof plan.name === 'string' &&
          plan.name.length > 0 &&
          typeof plan.amount === 'number' &&
          plan.amount > 0 &&
          plan.interval
        );
      });
  } catch (error) {
    console.error('Error fetching Stripe plans:', error);
    // Plans will be empty array, Login component handles this gracefully
  }

  return (
    <Suspense>
      <Login mode="signup" initialPriceId={priceId || undefined} plans={plans} />
    </Suspense>
  );
}
