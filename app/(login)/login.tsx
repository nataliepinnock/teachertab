'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useState } from 'react';
import type Stripe from 'stripe';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { TeacherTabLogo } from '@/components/ui/logo';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export type PlanOption = {
  id: string;
  name: string;
  amount: number;
  interval: Stripe.Price.Recurring.Interval;
  description?: string | null;
};

export function Login({
  mode = 'signin',
  plans = [],
  initialPriceId
}: {
  mode?: 'signin' | 'signup';
  plans?: PlanOption[];
  initialPriceId?: string;
}) {
  const searchParams = useSearchParams();
  const redirectQuery = searchParams.get('redirect');
  const priceIdQuery = searchParams.get('priceId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  // Ensure plans is always a valid array with strict validation
  const safePlans = useMemo(() => {
    try {
      if (!Array.isArray(plans)) {
        return [];
      }
      return plans.filter((plan): plan is PlanOption => {
        try {
          // Strict validation - ensure plan is an object with all required properties
          if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
            return false;
          }
          
          // Check id exists and is truthy
          if (!plan.id || typeof plan.id !== 'string') {
            return false;
          }
          
          // Check name exists, is a string, and is not empty
          if (!plan.name || typeof plan.name !== 'string' || plan.name.trim().length === 0) {
            return false;
          }
          
          // Check amount exists and is a valid number
          if (typeof plan.amount !== 'number' || !Number.isFinite(plan.amount) || plan.amount <= 0) {
            return false;
          }
          
          // Check interval exists
          if (!plan.interval || typeof plan.interval !== 'string') {
            return false;
          }
          
          return true;
        } catch {
          return false;
        }
      });
    } catch {
      return [];
    }
  }, [plans]);

  const statePriceId = typeof state?.priceId === 'string' ? state.priceId : undefined;
  const computedInitialPlan = useMemo(() => {
    if (mode !== 'signup') {
      return priceIdQuery || '';
    }
    return (
      statePriceId ||
      initialPriceId ||
      priceIdQuery ||
      safePlans[0]?.id ||
      ''
    );
  }, [mode, statePriceId, initialPriceId, priceIdQuery, safePlans]);

  const [selectedPlan, setSelectedPlan] = useState(computedInitialPlan);

  useEffect(() => {
    if (mode === 'signup') {
      setSelectedPlan(computedInitialPlan);
    }
  }, [computedInitialPlan, mode]);

  const redirectValue = mode === 'signup' ? 'checkout' : redirectQuery || '';
  const priceFieldValue =
    mode === 'signup' ? selectedPlan : statePriceId || priceIdQuery || '';

  const canSubmit = mode === 'signup' ? Boolean(selectedPlan) && safePlans.length > 0 : true;

  const switchLinkHref = useMemo(() => {
    if (mode === 'signin') {
      const params = new URLSearchParams();
      params.set('redirect', 'checkout');
      if (priceIdQuery) {
        params.set('priceId', priceIdQuery);
      }
      return `/sign-up${params.toString() ? `?${params.toString()}` : ''}`;
    }

    const params = new URLSearchParams();
    params.set('redirect', 'checkout');
    if (selectedPlan) {
      params.set('priceId', selectedPlan);
    }
    return `/sign-in${params.toString() ? `?${params.toString()}` : ''}`;
  }, [mode, priceIdQuery, selectedPlan]);

  const formatPrice = (amount: number, interval: string) => {
    const currencyAmount = (amount / 100).toFixed(2);
    return `£${currencyAmount} per ${interval}`;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <TeacherTabLogo size="lg" className="text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin'
            ? 'Welcome back to TeacherTab'
            : 'Join TeacherTab today'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'signin'
            ? 'Sign in to continue your teaching journey'
            : 'Start organizing your teaching life'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirectValue} />
          <input type="hidden" name="priceId" value={priceFieldValue} />
          
          {mode === 'signup' && (
            <>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose your subscription plan
                </Label>
                {safePlans.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Subscription plans are currently unavailable. Please try again later.
                  </p>
                ) : (
                  <RadioGroup
                    value={selectedPlan}
                    onValueChange={setSelectedPlan}
                    className="space-y-3"
                  >
                    {safePlans.map((plan) => (
                        <label
                          key={plan.id}
                          htmlFor={`plan-${plan.id}`}
                          className={`flex items-start justify-between gap-4 rounded-xl border p-4 transition hover:border-blue-500 ${
                            selectedPlan === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem
                              value={plan.id}
                              id={`plan-${plan.id}`}
                              className="mt-1"
                            />
                            <div>
                              <p className="text-base font-semibold text-gray-900">
                                {plan.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatPrice(plan.amount, plan.interval || 'month')}
                              </p>
                              {plan.description && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {plan.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                  </RadioGroup>
                )}
              </div>

              <div>
                <Label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </Label>
                <div className="mt-1">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    defaultValue={state.name}
                    required
                    maxLength={100}
                    className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher Type
                </Label>
                <RadioGroup
                  defaultValue="primary"
                  name="teacherType"
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="primary" id="primary" />
                    <Label htmlFor="primary">Primary Teacher</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="secondary" id="secondary" />
                    <Label htmlFor="secondary">Secondary Teacher</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Timetable Cycle
                </Label>
                <RadioGroup
                  defaultValue="weekly"
                  name="timetableCycle"
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly">Weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2-weekly" id="2-weekly" />
                    <Label htmlFor="2-weekly">2-Week Cycle</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {state?.error && (
            <div className="text-red-500 text-sm">{state.error}</div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={pending || !canSubmit}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                {mode === 'signin'
                  ? 'New to our platform?'
                  : 'Already have an account?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={switchLinkHref}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {mode === 'signin'
                ? 'Create an account'
                : 'Sign in to existing account'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
