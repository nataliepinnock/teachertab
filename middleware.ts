import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  // Allow beta page and its sub-routes
  if (pathname === '/beta' || pathname.startsWith('/beta/')) {
    let res = NextResponse.next();
    
    // Still handle session refresh for beta page (in case needed later)
    if (sessionCookie && request.method === 'GET') {
      try {
        const parsed = await verifyToken(sessionCookie.value);
        const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

        res.cookies.set({
          name: 'session',
          value: await signToken({
            ...parsed,
            expires: expiresInOneDay.toISOString()
          }),
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          expires: expiresInOneDay
        });
      } catch (error) {
        console.error('Error updating session:', error);
        res.cookies.delete('session');
      }
    }
    
    return res;
  }

  // Allow API routes (needed for beta signup form)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Redirect everything else to beta page
  return NextResponse.redirect(new URL('/beta', request.url));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
  runtime: 'nodejs'
};
