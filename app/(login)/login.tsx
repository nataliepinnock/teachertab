'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useState, Suspense } from 'react';
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
import { getTeachingPhaseOptions, getLocalizedOrganizing, type Location } from '@/lib/utils/localization';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type PlanOption = {
  id: string;
  name: string;
  amount: number;
  interval: Stripe.Price.Recurring.Interval;
  description?: string | null;
};

function LoginContent({
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
  const oauthError = searchParams.get('error');
  const checkoutStatus = searchParams.get('checkout');
  const checkoutError = searchParams.get('error');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  const getOAuthErrorMessage = (error: string): string => {
    switch (error) {
      case 'oauth_cancelled':
        return 'Sign in was cancelled.';
      case 'oauth_failed':
        return 'Sign in failed. Please try again.';
      case 'invalid_state':
        return 'Invalid sign in request. Please try again.';
      case 'oauth_not_configured':
        return 'OAuth is not configured. Please use email sign in.';
      case 'email_not_verified':
        return 'Your email is not verified. Please use a verified email address.';
      case 'email_not_available':
        return 'Email address not available from your account.';
      case 'subscription_required':
        return 'Your subscription has expired. Please renew to continue.';
      case 'account_deleted':
        return 'This account has been deleted and cannot be accessed. If you believe this is an error, please contact support.';
      case 'no_plan_selected':
        return 'Please select a subscription plan.';
      case 'user_not_found':
        return mode === 'signup' 
          ? 'Please select a subscription plan and try again.' 
          : 'No account found. Please sign up first.';
      case 'oauth_error':
        return 'An error occurred during sign in. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  // Get error message from OAuth, checkout, or form
  let errorMessage = '';
  if (checkoutStatus === 'failed') {
    if (checkoutError) {
      errorMessage = decodeURIComponent(checkoutError);
    } else {
      errorMessage = 'Payment processing failed. Please try again.';
    }
  } else if (oauthError) {
    errorMessage = getOAuthErrorMessage(oauthError);
  } else {
    errorMessage = state.error ?? '';
  }

  // Ensure plans is always a valid array with strict validation and deduplication
  const safePlans = useMemo(() => {
    try {
      if (!Array.isArray(plans)) {
        return [];
      }
      const validatedPlans = plans.filter((plan): plan is PlanOption => {
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
      
      // Deduplicate by plan ID - keep first occurrence of each unique ID
      const seenIds = new Set<string>();
      return validatedPlans.filter((plan) => {
        if (seenIds.has(plan.id)) {
          return false;
        }
        seenIds.add(plan.id);
        return true;
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
  const [location, setLocation] = useState<Location>('UK');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (mode === 'signup') {
      setSelectedPlan(computedInitialPlan);
    }
  }, [computedInitialPlan, mode]);

  const redirectValue = mode === 'signup' ? 'checkout' : redirectQuery || '';
  const priceFieldValue =
    mode === 'signup' ? selectedPlan : statePriceId || priceIdQuery || '';

  const canSubmit = mode === 'signup' 
    ? Boolean(selectedPlan) && safePlans.length > 0 && agreedToTerms 
    : true;

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
            : `Start ${getLocalizedOrganizing(location)} your teaching life`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirectValue} />
          <input type="hidden" name="priceId" value={priceFieldValue} />
          {mode === 'signup' && (
            <input type="hidden" name="marketingEmails" value={marketingEmails ? 'true' : 'false'} />
          )}
          
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
                  Location
                </Label>
                <RadioGroup
                  defaultValue="UK"
                  name="location"
                  value={location}
                  onValueChange={(value) => setLocation(value as Location)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UK" id="location-uk" />
                    <Label htmlFor="location-uk">UK</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="US" id="location-us" />
                    <Label htmlFor="location-us">US</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Other" id="location-other" />
                    <Label htmlFor="location-other">Other</Label>
                  </div>
                </RadioGroup>
                <p className="mt-1 text-xs text-gray-500">
                  This affects terminology used throughout the app (e.g., Term vs Semester, INSET vs Training Day)
                </p>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  What phase do you teach?
                </Label>
                <Select name="teachingPhase" defaultValue={getTeachingPhaseOptions(location)[0]?.value || 'primary'}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select teaching phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTeachingPhaseOptions(location).map((phase) => (
                      <SelectItem key={phase.value} value={phase.value}>
                        {phase.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  How would you like your {location === 'US' ? 'schedule' : 'timetable'} color coded?
                </Label>
                <RadioGroup
                  defaultValue="subject"
                  name="colorPreference"
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="subject" id="color-subject" />
                    <Label htmlFor="color-subject">By Subject</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="class" id="color-class" />
                    <Label htmlFor="color-class">By Class</Label>
                  </div>
                </RadioGroup>
                <p className="mt-1 text-xs text-gray-500">
                  This determines which colors are used for your lessons in the calendar
                </p>
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

          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              How would you like to log in?
            </h3>

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

            <div className="mt-4">
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

            {mode === 'signin' && (
              <div className="flex justify-end mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                {errorMessage}
              </div>
            )}

            {mode === 'signup' && (
              <div className="mt-4 space-y-3">
                {/* Required Terms & Privacy Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms-consent"
                    name="termsConsent"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <label htmlFor="terms-consent" className="text-sm text-gray-700 cursor-pointer leading-5">
                    I agree to TeacherTab's{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-500 underline" target="_blank">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline" target="_blank">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Optional Marketing Emails Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="marketing-emails"
                    name="marketingEmails"
                    checked={marketingEmails}
                    onChange={(e) => setMarketingEmails(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <label htmlFor="marketing-emails" className="text-sm text-gray-700 cursor-pointer leading-5">
                    Email me teaching tips and product updates (you can unsubscribe anytime)
                  </label>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button
                type="submit"
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <a
            href={`/api/auth/google?mode=${mode}${priceFieldValue ? `&priceId=${priceFieldValue}` : ''}${redirectValue ? `&redirect=${redirectValue}` : ''}`}
            className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 border rounded-full font-medium text-sm transition-colors ${
              mode === 'signup' && !priceFieldValue
                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={(e) => {
              if (mode === 'signup' && !priceFieldValue) {
                e.preventDefault();
              }
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>
          
          <a
            href={`/api/auth/microsoft?mode=${mode}${priceFieldValue ? `&priceId=${priceFieldValue}` : ''}${redirectValue ? `&redirect=${redirectValue}` : ''}`}
            className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 border rounded-full font-medium text-sm transition-colors ${
              mode === 'signup' && !priceFieldValue
                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={(e) => {
              if (mode === 'signup' && !priceFieldValue) {
                e.preventDefault();
              }
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
              <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022"/>
              <path d="M23 11.4H11.6V0H23v11.4z" fill="#7FBA00"/>
              <path d="M11.4 23H0V11.6h11.4V23z" fill="#00A4EF"/>
              <path d="M23 23H11.6V11.6H23V23z" fill="#FFB900"/>
            </svg>
            Continue with Microsoft
          </a>
        </div>

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

export function Login({
  mode = 'signin',
  plans = [],
  initialPriceId
}: {
  mode?: 'signin' | 'signup';
  plans?: PlanOption[];
  initialPriceId?: string;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent mode={mode} plans={plans} initialPriceId={initialPriceId} />
    </Suspense>
  );
}
