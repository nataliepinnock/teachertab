import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Login } from '../login';

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

  // Force users to choose a plan first
  if (!priceId) {
    redirect('/pricing');
  }

  return <Login mode="signup" />;
}
