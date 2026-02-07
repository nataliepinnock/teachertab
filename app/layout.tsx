import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import TermlyCMP from '@/components/TermlyCMP';

const WEBSITE_UUID = '1432f3dc-f773-4030-aec0-71b2e73afd60'

  
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
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <TermlyCMP autoBlock={true} masterConsentsOrigin="https://yourdomain.com" websiteUUID={WEBSITE_UUID} />
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
