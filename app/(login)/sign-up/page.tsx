import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Login } from '../login';

export const dynamic = 'force-dynamic';

export default function SignUpPage({
  searchParams
}: {
  searchParams?: { priceId?: string };
}) {
  // Force users to choose a plan first
  if (!searchParams?.priceId) {
    redirect('/pricing');
  }

  return (
    <Suspense>
      <Login mode="signup" />
    </Suspense>
  );
}
