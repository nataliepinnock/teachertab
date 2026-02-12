'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import useSWR from 'swr';
import { useState } from 'react';

interface PlanData {
  name: string;
  price: number;
  currency: string;
  interval: string;
  trialDays: number;
  priceId?: string;
}

interface PricingData {
  gbp: {
    monthly: PlanData;
    annual: PlanData;
  };
  usd: {
    monthly: PlanData;
    annual: PlanData;
  };
  eur: {
    monthly: PlanData;
    annual: PlanData;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PricingSection() {
  const [currency, setCurrency] = useState<'gbp' | 'usd' | 'eur'>('gbp');
  const { data, error, isLoading } = useSWR<PricingData>('/api/pricing', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 3600000, // Revalidate every hour
  });

  if (isLoading) {
    return (
      <section id="pricing" className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-[#001b3d]">
              Pricing
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-4xl lg:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-8 ring-1 ring-gray-900/10 h-64 animate-pulse" />
            <div className="rounded-2xl bg-gray-50 p-8 ring-1 ring-gray-900/10 h-64 animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return null; // Fail silently if pricing data unavailable
  }

  // Get prices for selected currency from API
  const currencyData = data[currency];
  const monthlyAmount = currencyData?.monthly?.price || 0;
  const annualAmount = currencyData?.annual?.price || 0;
  const monthlyAnnualTotal = monthlyAmount * 12;
  const annualMonthlyEquivalent = annualAmount / 12;
  const savingsPercentage = monthlyAmount > 0 && annualMonthlyEquivalent > 0
    ? Math.round(((monthlyAmount - annualMonthlyEquivalent) / monthlyAmount) * 100)
    : 0;
  const savingsAmount = monthlyAnnualTotal - annualAmount;

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-[#001b3d]">
            Pricing
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Choose the plan that works best for you. Cancel anytime.
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
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-4xl lg:grid-cols-2">
          <PricingCard
            name={currencyData?.monthly?.name || 'Monthly'}
            price={monthlyAmount}
            currency={currency.toUpperCase()}
            interval={currencyData?.monthly?.interval || 'month'}
            trialDays={currencyData?.monthly?.trialDays || 0}
            priceId={currencyData?.monthly?.priceId}
          />
          <PricingCard
            name={currencyData?.annual?.name || 'Annual'}
            price={annualAmount}
            currency={currency.toUpperCase()}
            interval={currencyData?.annual?.interval || 'year'}
            trialDays={currencyData?.annual?.trialDays || 0}
            priceId={currencyData?.annual?.priceId}
            popular={true}
            savingsPercentage={savingsPercentage}
            savingsAmount={savingsAmount}
          />
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  price,
  currency,
  interval,
  trialDays,
  priceId,
  popular = false,
  savingsPercentage = 0,
  savingsAmount = 0,
}: {
  name: string;
  price: number;
  currency: string;
  interval: string;
  trialDays: number;
  priceId?: string;
  popular?: boolean;
  savingsPercentage?: number;
  savingsAmount?: number;
}) {
  const formatPrice = (amount: number, curr: string) => {
    const symbol = curr.toUpperCase() === 'GBP' ? '£' : curr.toUpperCase() === 'USD' ? '$' : '€';
    const isEur = curr.toUpperCase() === 'EUR';
    return `${symbol}${(amount / 100).toFixed(isEur ? 0 : 2)}`;
  };

  return (
    <div 
      className={`rounded-2xl bg-gray-50 p-8 ring-1 relative ${
        popular 
          ? 'ring-2 ring-[#fbae36]' 
          : 'ring-gray-900/10'
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <span className="bg-[#fbae36] text-[#001b3d] px-4 py-1 rounded-full text-sm font-semibold">
            Best Value
          </span>
        </div>
      )}
      <h3 className="text-lg font-bold leading-8 text-gray-900">
        {name}
      </h3>
      {trialDays > 0 && (
        <p className="mt-4 text-sm leading-6 text-gray-600">
          {trialDays} day free trial
        </p>
      )}
      <p className="mt-6 flex items-baseline gap-x-2">
        <span className="text-5xl font-bold tracking-tight text-gray-900">
          {formatPrice(price, currency)}
        </span>
        <span className="text-sm font-semibold leading-6 text-gray-600">
          /{interval}
        </span>
      </p>
      {popular && savingsPercentage > 0 && savingsAmount > 0 && (
        <p className="mt-3 text-sm text-[#001b3d] font-semibold">
          Save {formatPrice(savingsAmount, currency)} per year ({savingsPercentage}% off)
        </p>
      )}
      <div className="mt-8">
        <Button
          asChild
          variant={popular ? 'accent' : 'default'}
          className={`w-full rounded-full ${
            popular 
              ? 'bg-[#fbae36] hover:bg-[#d69225] text-white' 
              : 'bg-[#001b3d] hover:bg-[#000e28] text-white'
          }`}
        >
          <Link href={priceId ? `/sign-up?priceId=${priceId}` : '/sign-up'}>
            Get started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
