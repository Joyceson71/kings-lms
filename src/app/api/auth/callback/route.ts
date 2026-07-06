import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Create redirect response
      const response = NextResponse.redirect(`${origin}${next}`);
      // Set the fake auth cookie used by middleware to allow access
      response.cookies.set('kings_lms_auth', 'true', { 
        path: '/', 
        maxAge: 604800, 
        sameSite: 'lax' 
      });
      return response;
    } else {
      console.error('Auth callback error:', error);
    }
  }

  // Return the user to an error page if auth fails
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
