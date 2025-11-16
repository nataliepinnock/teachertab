import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

type ResetPasswordPageProps = {
  params: {
    token: string;
  };
};

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  return (
    <Suspense>
      <ResetPasswordForm token={params.token} />
    </Suspense>
  );
}





