import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // We must return this exact response object after Supabase mutates it.
  // Never construct a new NextResponse for the final return — only for redirects.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Step 1: mutate the request so server-side code in this request sees fresh cookies
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Step 2: rebuild the response carrying the mutated request
          supabaseResponse = NextResponse.next({ request });
          // Step 3: write cookies onto the outgoing response so the browser stores them
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // DO NOT put any logic between createServerClient and getUser().
  // getUser() is what refreshes the token and calls setAll above.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Pages that should only be reachable when NOT authenticated
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/reset-password' ||
    pathname === '/update-password';

  // Pages that require authentication
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/attend');

  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Preserve the intended destination so we can redirect back after login
    loginUrl.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(loginUrl);
    // Copy any cookies Supabase just set onto the redirect response
    supabaseResponse.cookies.getAll().forEach(({ name, value }) =>
      redirect.cookies.set(name, value)
    );
    return redirect;
  }

  if (user && isAuthRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    const redirect = NextResponse.redirect(dashboardUrl);
    supabaseResponse.cookies.getAll().forEach(({ name, value }) =>
      redirect.cookies.set(name, value)
    );
    return redirect;
  }

  // Always return supabaseResponse (never a freshly constructed response).
  // This ensures any session cookies Supabase set are forwarded to the browser.
  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
