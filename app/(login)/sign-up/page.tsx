import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Login } from '../login';

export const dynamic = 'force-dynamic';

export default async function SignUpPage({
  searchParams
}: {
  // In Next.js 15 with PPR, searchParams is a Promise
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const resolvedParams =
    typeof (searchParams as any)?.then === 'function'
      ? await (searchParams as Promise<Record<string, string | string[] | undefined>>)
      : ((searchParams as Record<string, string | string[] | undefined>) || undefined);

  const rawPriceId = resolvedParams?.priceId;
  const priceId = Array.isArray(rawPriceId) ? rawPriceId[0] : rawPriceId;

  // Force users to choose a plan first
  if (!priceId) {
    redirect('/pricing');
  }

  return <Login mode="signup" />;
}
