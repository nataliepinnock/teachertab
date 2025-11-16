import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

export default async function ResetPasswordPage({
  params,
}: {
  // Accept either a plain object or a Promise (to satisfy differing Next.js type constraints)
  params: any;
}) {
  const resolvedParams = typeof params?.then === 'function' ? await params : params;
  const token: string = resolvedParams?.token;

  return (
    <Suspense>
      <ResetPasswordForm token={token} />
    </Suspense>
  );
}





