import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * Auth callback route — exchanges a one-time code for a session.
 *
 * Supabase redirects here after OAuth sign-ins. The redirect response is
 * created first so session cookies can be attached directly to it before
 * the browser follows the redirect.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const redirectResponse = NextResponse.redirect(`${origin}/wardrobe`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          // Write session cookies onto the redirect response so the browser
          // receives them in the same round-trip as the redirect.
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
    return redirectResponse;
  }

  return NextResponse.redirect(`${origin}/wardrobe`);
}
