import { Suspense } from 'react';
import { Login } from '../login';
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

  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts()
  ]);

  const plans = prices
    .map((price) => {
      const product = products.find((product) => product.id === price.productId);

      if (price.unitAmount == null || !price.interval || !product?.name) {
        return null;
      }

      return {
        id: price.id,
        name: product.name,
        amount: price.unitAmount,
        interval: price.interval,
        description: product.description
      };
    })
    .filter((plan): plan is {
      id: string;
      name: string;
      amount: number;
      interval: string;
      description?: string | null;
    } => Boolean(plan));

  return (
    <Suspense>
      <Login mode="signup" initialPriceId={priceId || undefined} plans={plans} />
    </Suspense>
  );
}
