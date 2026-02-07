import { NextRequest, NextResponse } from 'next/server';
import { getMicrosoftAccessToken, getMicrosoftUserInfo } from '@/lib/oauth/providers';
import { getOAuthRedirectUri } from '@/lib/oauth/utils';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/session';
import { createCheckoutSessionUrl } from '@/lib/payments/checkout-helper';
import { deleteUserIfNoSubscription } from '@/lib/db/queries';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

async function verifyOAuthState(state: string): Promise<{ provider: string; mode: string; priceId: string; redirect: string } | null> {
  const cookie = (await cookies()).get('oauth_state');
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie.value, key, {
      algorithms: ['HS256'],
    });
    
    if (payload.state !== state) return null;
    if (new Date(payload.expires as string) < new Date()) return null;

    const [mode, priceId, redirect] = (payload.mode as string).split(':');
    return { provider: payload.provider as string, mode, priceId: priceId || '', redirect: redirect || '' };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_cancelled', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url));
  }

  const stateData = await verifyOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect(new URL('/sign-in?error=invalid_state', request.url));
  }

  // Clear the OAuth state cookie
  (await cookies()).delete('oauth_state');

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_not_configured', request.url));
  }

  try {
    console.log('[oauth/microsoft] Starting callback processing:', {
      hasCode: !!code,
      hasState: !!state,
      clientId: clientId?.substring(0, 10) + '...',
    });

    const redirectUri = getOAuthRedirectUri('microsoft');
    console.log('[oauth/microsoft] Redirect URI:', redirectUri);

    console.log('[oauth/microsoft] Getting access token...');
    const accessToken = await getMicrosoftAccessToken(code, {
      clientId,
      clientSecret,
      redirectUri,
    });
    console.log('[oauth/microsoft] Access token received');

    console.log('[oauth/microsoft] Getting user info...');
    const userInfo = await getMicrosoftUserInfo(accessToken);
    console.log('[oauth/microsoft] User info received:', {
      hasEmail: !!(userInfo.mail || userInfo.userPrincipalName),
      hasName: !!userInfo.displayName,
    });
    
    // Microsoft uses 'mail' or 'userPrincipalName' for email
    const email = userInfo.mail || userInfo.userPrincipalName;
    const name = userInfo.displayName || `${userInfo.givenName || ''} ${userInfo.surname || ''}`.trim() || email;

    if (!email) {
      return NextResponse.redirect(new URL('/sign-in?error=email_not_available', request.url));
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      // Sign in existing user
      const activeStatuses = new Set(['active', 'trialing']);
      const isSubscriptionActive =
        typeof existingUser.subscriptionStatus === 'string' &&
        activeStatuses.has(existingUser.subscriptionStatus);

      if (!isSubscriptionActive) {
        await deleteUserIfNoSubscription(existingUser.id);
        return NextResponse.redirect(new URL('/sign-in?error=subscription_required', request.url));
      }

      await setSession(existingUser);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      // New user - need to handle signup flow
      // If there's a priceId, treat it as signup even if mode is 'signin'
      const isSignup = stateData.mode === 'signup' || !!stateData.priceId;
      
      if (isSignup) {
        if (!stateData.priceId) {
          return NextResponse.redirect(new URL('/sign-up?error=no_plan_selected', request.url));
        }

        // Create a temporary password hash (OAuth users don't need passwords, but we need to store something)
        const { randomBytes } = await import('crypto');
        const tempPasswordHash = await hashPassword(randomBytes(32).toString('hex'));

        // Create checkout session with OAuth user data
        const checkoutUrl = await createCheckoutSessionUrl({
          user: null,
          priceId: stateData.priceId,
          context: 'signup',
          signupData: {
            name: name,
            email: email,
            passwordHash: tempPasswordHash,
            teachingPhase: 'primary', // Default, user can change later
            colorPreference: 'subject', // Default
            timetableCycle: 'weekly', // Default
            location: 'UK', // Default
          },
        });

        return NextResponse.redirect(checkoutUrl);
      } else {
        // Sign in mode but user doesn't exist - redirect to sign-up
        const signUpUrl = new URL('/sign-up', request.url);
        signUpUrl.searchParams.set('error', 'user_not_found');
        return NextResponse.redirect(signUpUrl);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[oauth/microsoft] Error in callback:', {
      error: errorMessage,
      stack: errorStack,
      hasCode: !!code,
      hasState: !!state,
    });

    return NextResponse.redirect(new URL(`/sign-in?error=oauth_error`, request.url));
  }
}

