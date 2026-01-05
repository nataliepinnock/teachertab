import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

const protectedRoutes = '/dashboard';
const publicRoutes = ['/beta', '/sign-in', '/sign-up', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(protectedRoutes);
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));

  // Redirect root and other non-public routes to beta page
  if (!isPublicRoute && !isProtectedRoute && pathname !== '/') {
    // Allow API routes and static files
    if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/images')) {
      return NextResponse.next();
    }
    // Redirect to beta page
    return NextResponse.redirect(new URL('/beta', request.url));
  }

  // Redirect root to beta page
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/beta', request.url));
  }

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let res = NextResponse.next();

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
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
  runtime: 'nodejs'
};
