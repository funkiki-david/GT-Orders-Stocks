import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, isUserRole } from '@/lib/auth';

const protectedPaths = ['/inventory', '/customers', '/sales-orders'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(AUTH_COOKIE)?.value;
  const isLoggedIn = isUserRole(role);

  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/inventory', request.url));
  }

  if (!isLoggedIn && protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
