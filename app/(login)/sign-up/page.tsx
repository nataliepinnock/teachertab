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

  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts()
  ]);

  const plans: PlanOption[] = prices.flatMap((price) => {
    const product = products.find((product) => product.id === price.productId);

    if (price.unitAmount == null || !price.interval || !product?.name) {
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

  return (
    <Suspense>
      <Login mode="signup" initialPriceId={priceId || undefined} plans={plans} />
    </Suspense>
  );
}
