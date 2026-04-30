import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // get session
  const { data: { session } } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;

  // auto ke lgoin
  if (path === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // proteksi hal kalo belom login
  if (!session && (path.startsWith('/user') || path.startsWith('/admin'))) {
    // mau masuk tp belum login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // cek role
  if (session) {
    // Ambil data role dari tabel profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role;

    // kalo dah login tapi mau buka halaman login lagi, lempar balik ke halaman masing-masing
    if (path.startsWith('/login')) {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (userRole === 'user') {
        return NextResponse.redirect(new URL('/user', request.url));
      }
    }

    // /user gbs ke /admin
    if (path.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/user', request.url));
    }

    // /admin gbs ke /user
    if (path.startsWith('/user') && userRole !== 'user') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

// daerah yg boleh
export const config = {
  matcher: [
    '/',
    '/login',
    '/user/:path*',
    '/admin/:path*'
  ],
};