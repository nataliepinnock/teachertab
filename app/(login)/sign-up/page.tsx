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

    plans = prices.flatMap((price) => {
      const product = products.find((product) => product.id === price.productId);

      // Ensure all required fields exist before creating plan
      if (
        !price.id ||
        price.unitAmount == null ||
        !price.interval ||
        !product ||
        !product.name
      ) {
        return [];
      }

      return [
        {
          id: price.id,
          name: product.name,
          amount: price.unitAmount,
          interval: price.interval,
          description: product.description ?? null
        }
      ];
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
