'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Lock, Trash2, CreditCard } from 'lucide-react';
import { updateAccount, updatePassword, deleteAccount } from '@/app/(login)/actions';
import { customerPortalAction } from '@/lib/payments/actions';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type AccountState = {
  name?: string;
  error?: string;
  success?: string;
};

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: AccountState;
  nameValue?: string;
  emailValue?: string;
  teacherTypeValue?: string;
  timetableCycleValue?: string;
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = '',
  teacherTypeValue = 'primary',
  timetableCycleValue = 'weekly'
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Full Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your full name"
          defaultValue={state.name || nameValue}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue}
          required
        />
      </div>
      <div>
        <Label className="mb-2">Teacher Type</Label>
        <RadioGroup
          defaultValue={teacherTypeValue}
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
        <Label className="mb-2">Timetable Cycle</Label>
        <RadioGroup
          defaultValue={timetableCycleValue}
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
  );
}

function AccountFormWithData({ state }: { state: AccountState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  return (
    <AccountForm
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
      teacherTypeValue={user?.teacherType ?? 'primary'}
      timetableCycleValue={user?.timetableCycle ?? 'weekly'}
    />
  );
}

function SubscriptionSection() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  
  const handleManageSubscription = async () => {
    await customerPortalAction();
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {user.stripeCustomerId ? (
            <>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Manage your subscription, payment methods, and billing history through the Stripe customer portal.
                </p>
                <Button
                  onClick={handleManageSubscription}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscription
                </Button>
              </div>
              {user.planName && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">
                    Current Plan: <span className="font-medium text-gray-900">{user.planName}</span>
                  </p>
                </div>
              )}
            </>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                You don't have an active subscription. Visit the pricing page to subscribe.
              </p>
              <Button
                onClick={() => window.location.href = '/pricing'}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                View Pricing Plans
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountPage() {
  const [accountState, accountAction, isAccountPending] = useActionState<AccountState, FormData>(
    updateAccount,
    {}
  );

  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(updatePassword, {});

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteState,
    FormData
  >(deleteAccount, {});

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Account Settings
      </h1>

      {/* Subscription Section */}
      <Suspense fallback={<Card className="mb-8"><CardContent className="p-6"><div className="animate-pulse h-20 bg-gray-100 rounded"></div></CardContent></Card>}>
        <SubscriptionSection />
      </Suspense>

      {/* Account Information Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={accountAction}>
            <Suspense fallback={<AccountForm state={accountState} />}>
              <AccountFormWithData state={accountState} />
            </Suspense>
            {accountState.error && (
              <p className="text-red-500 text-sm">{accountState.error}</p>
            )}
            {accountState.success && (
              <p className="text-green-500 text-sm">{accountState.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isAccountPending}
            >
              {isAccountPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={passwordAction}>
            <div>
              <Label htmlFor="current-password" className="mb-2">
                Current Password
              </Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.currentPassword}
              />
            </div>
            <div>
              <Label htmlFor="new-password" className="mb-2">
                New Password
              </Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.newPassword}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="mb-2">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.confirmPassword}
              />
            </div>
            {passwordState.error && (
              <p className="text-red-500 text-sm">{passwordState.error}</p>
            )}
            {passwordState.success && (
              <p className="text-green-500 text-sm">{passwordState.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPasswordPending}
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Account deletion is non-reversable. Please proceed with caution.
          </p>
          <form action={deleteAction} className="space-y-4">
            <div>
              <Label htmlFor="delete-password" className="mb-2">
                Confirm Password
              </Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={deleteState.password}
              />
            </div>
            {deleteState.error && (
              <p className="text-red-500 text-sm">{deleteState.error}</p>
            )}
            <Button
              type="submit"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletePending}
            >
              {isDeletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

