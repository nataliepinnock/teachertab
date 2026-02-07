import { NextRequest, NextResponse } from 'next/server';
import { getMicrosoftAuthUrl } from '@/lib/oauth/providers';
import { generateState, getOAuthRedirectUri } from '@/lib/oauth/utils';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

// Store OAuth state in a signed cookie
async function createOAuthState(state: string, provider: string, mode: string) {
  const expiresIn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const payload = { state, provider, mode, expires: expiresIn.toISOString() };
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(key);
  
  (await cookies()).set('oauth_state', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: expiresIn,
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'signin'; // 'signin' or 'signup'
  const priceId = searchParams.get('priceId') || '';
  const redirect = searchParams.get('redirect') || '';

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Microsoft OAuth is not configured' },
      { status: 500 }
    );
  }

  const state = generateState();
  const redirectUri = getOAuthRedirectUri('microsoft');
  
  // Store state, mode, priceId, and redirect in signed cookie
  await createOAuthState(state, 'microsoft', `${mode}:${priceId}:${redirect}`);

  const authUrl = getMicrosoftAuthUrl(
    {
      clientId,
      clientSecret,
      redirectUri,
    },
    state
  );

  return NextResponse.redirect(authUrl);
}

