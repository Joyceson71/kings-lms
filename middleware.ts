import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // `supabaseResponse` must be the response returned from middleware so that
  // any refreshed session cookies set by Supabase are forwarded to the browser.
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
          // Write cookies onto the mutated request first so subsequent
          // server-side reads in this same request see the fresh values.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recreate the response so it carries the new request (with cookies).
          supabaseResponse = NextResponse.next({ request });
          // Write the cookies onto the outgoing response so the browser stores them.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not add any logic between createServerClient and getUser().
  // A simple mistake here will make it very hard to debug auth issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoggedIn = !!user;

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/signup/');

  // Protect dashboard and attendance pages.
  // /onboarding is intentionally excluded — it is the post-login profile-setup
  // page reached when a profile doesn't exist yet, so it must stay accessible.
  const isProtectedPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/attend');

  if (!isLoggedIn && isProtectedPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Forward any cookies Supabase just set so they survive the redirect.
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  if (isLoggedIn && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    // Forward any cookies Supabase just set so they survive the redirect.
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // IMPORTANT: return supabaseResponse (not a new NextResponse) so that the
  // session cookies Supabase set are included in the response to the browser.
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
