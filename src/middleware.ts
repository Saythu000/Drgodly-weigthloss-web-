import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseAttribution, ATTRIBUTION_COOKIE_NAME } from '@/lib/tracking/attribution';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const sessionCookie = request.cookies.get('drgodly_session')?.value;
  const isAuthenticated = sessionCookie === 'authenticated_admin_session';

  // Protect /dashboard routes: redirect to /login if not authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and visiting /login, redirect to /dashboard
  if (pathname === '/login') {
    if (isAuthenticated) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  const response = NextResponse.next();

  // Check for Marketing Attribution & Click IDs (utm_*, gclid, fbclid)
  const hasMarketingParams =
    searchParams.has('utm_source') ||
    searchParams.has('utm_medium') ||
    searchParams.has('utm_campaign') ||
    searchParams.has('gclid') ||
    searchParams.has('fbclid');

  const existingAttr = request.cookies.get(ATTRIBUTION_COOKIE_NAME)?.value;

  // Set or refresh attribution on new campaigns or initial first-touch visit
  if (hasMarketingParams || (!existingAttr && !pathname.startsWith('/api') && !pathname.startsWith('/_next'))) {
    const referrer = request.headers.get('referer');
    const attrData = parseAttribution(searchParams, referrer, pathname);

    response.cookies.set({
      name: ATTRIBUTION_COOKIE_NAME,
      value: JSON.stringify(attrData),
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 Days attribution window
      httpOnly: false, // Accessible to client-side intake if needed
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
