'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function UnsubscribePageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const emailParam = searchParams.get('email');

    if (emailParam) {
      setEmail(emailParam);
    }

    if (success === 'true') {
      setStatus('success');
    } else if (success === 'false') {
      setStatus('error');
    } else {
      // If no success param, try to unsubscribe via API
      if (emailParam) {
        fetch(`/api/unsubscribe?email=${encodeURIComponent(emailParam)}`)
          .then((res) => {
            if (res.ok) {
              setStatus('success');
            } else {
              setStatus('error');
            }
          })
          .catch(() => {
            setStatus('error');
          });
      } else {
        setStatus('error');
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Unsubscribe</h1>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your unsubscribe request...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Successfully Unsubscribed
              </h2>
              <p className="text-gray-600 mb-4">
                {email
                  ? `You have been unsubscribed from marketing emails. You will no longer receive promotional emails from TeacherTab.`
                  : `You have been unsubscribed from marketing emails.`}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                You will still receive important account-related emails, such as password resets and subscription updates.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/account"
                  className="text-blue-600 hover:text-blue-500 underline text-sm"
                >
                  Manage your email preferences
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Unable to Unsubscribe
              </h2>
              <p className="text-gray-600 mb-4">
                We encountered an error processing your unsubscribe request. Please try again or contact support.
              </p>
              <div className="mt-6 space-y-2">
                <Link
                  href="/dashboard/account"
                  className="block text-blue-600 hover:text-blue-500 underline text-sm"
                >
                  Manage your email preferences
                </Link>
                <a
                  href="mailto:support@teachertab.com"
                  className="block text-blue-600 hover:text-blue-500 underline text-sm"
                >
                  Contact support
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>}>
      <UnsubscribePageContent />
    </Suspense>
  );
}
