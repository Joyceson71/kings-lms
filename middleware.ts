import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // Rescue stray OAuth callbacks (e.g. if Supabase redirects to / or /dashboard)
  const code = request.nextUrl.searchParams.get('code');
  if (code && !pathname.startsWith('/api/auth/callback')) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/auth/callback';
    url.searchParams.set('next', pathname === '/' ? '/dashboard' : pathname);
    return NextResponse.redirect(url);
  }

  // Check actual session state
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup');

  const isDashboardPage = pathname.startsWith('/dashboard');

  if (!isLoggedIn && isDashboardPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
