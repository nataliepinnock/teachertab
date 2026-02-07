import { randomBytes } from 'crypto';

export function generateState(): string {
  return randomBytes(32).toString('hex');
}

export function getAppBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return 'http://localhost:3000';
}

export function getOAuthRedirectUri(provider: 'google' | 'microsoft'): string {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/api/auth/${provider}/callback`;
}

