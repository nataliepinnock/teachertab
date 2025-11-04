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

    const validPlans: PlanOption[] = [];

    for (const price of prices) {
      // Validate price has all required fields
      if (
        !price?.id ||
        price.unitAmount == null ||
        typeof price.unitAmount !== 'number' ||
        !price.interval ||
        typeof price.interval !== 'string'
      ) {
        continue;
      }

      const product = products.find((product) => product?.id === price.productId);

      // Ensure product exists and has required fields
      if (
        !product ||
        !product.id ||
        typeof product.name !== 'string' ||
        product.name.length === 0
      ) {
        continue;
      }

      // Create plan with validated types
      const plan: PlanOption = {
        id: price.id,
        name: product.name,
        amount: price.unitAmount, // TypeScript knows this is number from the check above
        interval: price.interval as PlanOption['interval'],
        description: product.description ?? null
      };

      validPlans.push(plan);
    }

    plans = validPlans;
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
