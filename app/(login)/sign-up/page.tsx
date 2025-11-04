import { Suspense } from 'react';
import { Login, type PlanOption } from '../login';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { ErrorBoundary } from '../error-boundary';

export const dynamic = 'force-dynamic';

export default async function SignUpPage({
  searchParams
}: {
  // Match Next 15 PageProps: searchParams can be a Promise
  searchParams?: Promise<any>;
}) {
  let resolvedParams: any = undefined;
  let priceId: string | undefined = undefined;
  let plans: PlanOption[] = [];

  try {
    resolvedParams = searchParams ? await searchParams : undefined;
    const rawPriceId = resolvedParams?.priceId as string | string[] | undefined;
    priceId = Array.isArray(rawPriceId) ? rawPriceId[0] : rawPriceId;
  } catch (error) {
    console.error('Error resolving search params:', error);
    // Continue with undefined priceId
  }

  try {
    const [prices, products] = await Promise.all([
      getStripePrices(),
      getStripeProducts()
    ]);

    // Ensure prices and products are arrays
    if (!Array.isArray(prices) || !Array.isArray(products)) {
      console.warn('Prices or products are not arrays');
      plans = [];
    } else {
      const validPlans: PlanOption[] = [];

      for (const price of prices) {
        try {
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
            amount: price.unitAmount,
            interval: price.interval as PlanOption['interval'],
            description: product.description ?? null
          };

          validPlans.push(plan);
        } catch (priceError) {
          console.error('Error processing price:', priceError);
          // Continue to next price
          continue;
        }
      }

      plans = validPlans;
    }
  } catch (error) {
    console.error('Error fetching Stripe plans:', error);
    // Plans will be empty array, Login component handles this gracefully
    plans = [];
  }

  // Always render the Login component, even if plans are empty
  // This ensures browser back navigation always works
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome back</h2>
            <p className="text-gray-600 mb-6">There was an issue loading the page. Please try signing up again.</p>
            <a
              href="/sign-up"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Sign Up
            </a>
          </div>
        </div>
      }
    >
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Login mode="signup" initialPriceId={priceId} plans={plans} />
      </Suspense>
    </ErrorBoundary>
  );
}
