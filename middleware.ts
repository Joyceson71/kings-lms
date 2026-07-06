import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware: Protect dashboard routes and redirect auth pages.
 *
 * Auth state is stored in localStorage (client-side), which middleware
 * can't read directly. We use a cookie `kings_lms_auth` set by the client
 * as a session flag. If the cookie is absent, redirect to /login.
 *
 * The cookie is set after successful login by the client.
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rescue stray OAuth callbacks (e.g. if Supabase redirects to / or /dashboard)
  const code = request.nextUrl.searchParams.get('code');
  if (code && !pathname.startsWith('/api/auth/callback')) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/auth/callback';
    url.searchParams.set('next', pathname === '/' ? '/dashboard' : pathname);
    return NextResponse.redirect(url);
  }

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup');

  const isDashboardPage = pathname.startsWith('/dashboard');

  // Check for our auth cookie (set by client after login)
  const authCookie = request.cookies.get('kings_lms_auth');
  const isLoggedIn = authCookie?.value === 'true';

  // Redirect unauthenticated users away from dashboard
  if (!isLoggedIn && isDashboardPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
