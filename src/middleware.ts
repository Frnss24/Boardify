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

  // get session dari Supabase
  const { data: { session } } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;

  // auto ke login
  if (path === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // proteksi halaman kalo belom login
  if (!session && (path.startsWith('/user') || path.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // kalo sudah login
  if (session) {
    // Ambil role dari tabel users
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = user?.role || 'user';

    // kalo dah login tapi mau buka halaman login lagi, lempar balik
    if (path.startsWith('/login')) {
      return NextResponse.redirect(
        new URL(userRole === 'admin' ? '/admin' : '/user', request.url)
      );
    }

    // /admin hanya bisa diakses admin
    if (path.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/user', request.url));
    }

    // /user hanya bisa diakses user
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