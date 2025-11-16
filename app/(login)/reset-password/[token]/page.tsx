import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <Suspense>
      <ResetPasswordForm token={params.token} />
    </Suspense>
  );
}





