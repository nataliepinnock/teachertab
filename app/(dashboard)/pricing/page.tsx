import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const monthlyPlan = products.find((product) => product.name === 'Monthly');
  const annualPlan = products.find((product) => product.name === 'Annual');

  const monthlyPrice = prices.find((price) => price.productId === monthlyPlan?.id);
  const annualPrice = prices.find((price) => price.productId === annualPlan?.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose your plan and get started today. Cancel anytime.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <PricingCard
          name={monthlyPlan?.name || 'Monthly'}
          price={monthlyPrice?.unitAmount || 399}
          interval={monthlyPrice?.interval || 'month'}
          trialDays={0}
          features={[
            'Unlimited lesson planning',
            'Calendar management',
            'Student tracking',
            'Basic reports',
            'Email support',
          ]}
          priceId={monthlyPrice?.id}
        />
        <PricingCard
          name={annualPlan?.name || 'Annual'}
          price={annualPrice?.unitAmount || 3990}
          interval={annualPrice?.interval || 'year'}
          trialDays={0}
          features={[
            'Everything in Monthly, plus:',
            'Advanced analytics',
            'Custom templates',
            'Priority support',
            'Save 17% with annual billing',
          ]}
          priceId={annualPrice?.id}
          popular={true}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
  popular = false,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  popular?: boolean;
}) {
  return (
    <div className={`pt-6 ${popular ? 'relative border-2 border-orange-500 rounded-lg p-6' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      {trialDays > 0 && (
        <p className="text-sm text-gray-600 mb-4">
          with {trialDays} day free trial
        </p>
      )}
      <p className="text-4xl font-medium text-gray-900 mb-6">
        £{(price / 100).toFixed(2)}{' '}
        <span className="text-xl font-normal text-gray-600">
          per {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton />
      </form>
    </div>
  );
}
