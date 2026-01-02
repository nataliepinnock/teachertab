'use client';

import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { SubmitButton } from './submit-button';
import { useState } from 'react';
import useSWR from 'swr';

interface PricingData {
  monthly: {
    name: string;
    price: number;
    currency: string;
    interval: string;
    trialDays: number;
    priceId?: string;
  };
  annual: {
    name: string;
    price: number;
    currency: string;
    interval: string;
    trialDays: number;
    priceId?: string;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Nice round price equivalents for USD and EUR
const PRICING = {
  usd: {
    monthly: 1200, // $12.00
    annual: 12000, // $120.00
  },
  eur: {
    monthly: 1000, // €10.00
    annual: 10000, // €100.00
  },
};

export default function PricingPage() {
  const [currency, setCurrency] = useState<'gbp' | 'usd' | 'eur'>('gbp');
  const { data, error, isLoading } = useSWR<PricingData>('/api/pricing', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 3600000, // Revalidate every hour
  });

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your plan and get started today. Cancel anytime.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="pt-6 border rounded-lg p-6 h-64 animate-pulse bg-gray-50" />
          <div className="pt-6 border rounded-lg p-6 h-64 animate-pulse bg-gray-50" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Unable to load pricing at this time. Please try again later.</p>
        </div>
      </main>
    );
  }

  // Use original GBP pricing from API, or round equivalents for USD/EUR
  const monthlyAmount = currency === 'gbp' 
    ? (data.monthly.price || 0)
    : PRICING[currency].monthly;
  const annualAmount = currency === 'gbp'
    ? (data.annual.price || 0)
    : PRICING[currency].annual;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose your plan and get started today. Cancel anytime.
        </p>
        
        {/* Currency Toggle */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className="text-sm font-medium text-gray-700">Currency:</span>
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setCurrency('gbp')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currency === 'gbp'
                  ? 'bg-white text-[#001b3d] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              GBP
            </button>
            <button
              type="button"
              onClick={() => setCurrency('usd')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currency === 'usd'
                  ? 'bg-white text-[#001b3d] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              USD
            </button>
            <button
              type="button"
              onClick={() => setCurrency('eur')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currency === 'eur'
                  ? 'bg-white text-[#001b3d] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              EUR
            </button>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <PricingCard
          name={data.monthly.name}
          price={monthlyAmount}
          currency={currency.toUpperCase()}
          interval={data.monthly.interval}
          trialDays={data.monthly.trialDays}
          features={[
            'Unlimited lesson planning',
            'Calendar management',
            'Student tracking',
            'Basic reports',
            'Email support',
          ]}
          priceId={data.monthly.priceId}
        />
        <PricingCard
          name={data.annual.name}
          price={annualAmount}
          currency={currency.toUpperCase()}
          interval={data.annual.interval}
          trialDays={data.annual.trialDays}
          features={[
            'Everything in Monthly, plus:',
            'Advanced analytics',
            'Custom templates',
            'Priority support',
            'Save 17% with annual billing',
          ]}
          priceId={data.annual.priceId}
          popular={true}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  currency,
  interval,
  trialDays,
  features,
  priceId,
  popular = false,
}: {
  name: string;
  price: number;
  currency: string;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  popular?: boolean;
}) {
  const formatPrice = (amount: number, curr: string) => {
    const symbol = curr.toUpperCase() === 'GBP' ? '£' : curr.toUpperCase() === 'USD' ? '$' : '€';
    const isEur = curr.toUpperCase() === 'EUR';
    return `${symbol}${(amount / 100).toFixed(isEur ? 0 : 2)}`;
  };

  return (
    <div className={`pt-6 ${popular ? 'relative border-2 border-[#fbae36] rounded-lg p-6' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-[#fbae36] text-white px-4 py-1 rounded-full text-sm font-medium">
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
        {formatPrice(price, currency)}{' '}
        <span className="text-xl font-normal text-gray-600">
          per {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-[#fbae36] mr-2 mt-0.5 flex-shrink-0" />
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
