import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import TermlyCMP from '@/components/TermlyCMP';
import ContactWidget from '@/components/ContactWidget';
import Script from 'next/script';

const WEBSITE_UUID = '1432f3dc-f773-4030-aec0-71b2e73afd60'

// Build Termly script URL
const termlyScriptUrl = (() => {
  const url = new URL('https://app.termly.io');
  url.pathname = `/resource-blocker/${WEBSITE_UUID}`;
  url.searchParams.set('autoBlock', 'on');
  if (process.env.NEXT_PUBLIC_TERMLY_MASTER_CONSENTS_ORIGIN) {
    url.searchParams.set('masterConsentsOrigin', process.env.NEXT_PUBLIC_TERMLY_MASTER_CONSENTS_ORIGIN);
  }
  return url.toString();
})();

export const metadata: Metadata = {
  title: 'TeacherTab',
  description: 'Teach. Plan. Organise.',
  icons: {
    icon: [
      { url: '/images/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    shortcut: '/images/favicon.svg',
    apple: '/images/logo-light.svg'
  }
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-gray-50" suppressHydrationWarning>
        {/* Termly ResourceBlocker - Load early to block unapproved content */}
        {/* Note: Using afterInteractive to avoid hydration issues. Termly will still block third-party scripts effectively. */}
        <Script
          id="termly-resource-blocker"
          src={termlyScriptUrl}
          strategy="afterInteractive"
        />
        <TermlyCMP />
        <ContactWidget />
        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here
              // Only components that read this data will suspend
              '/api/user': getUser()
            }
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
