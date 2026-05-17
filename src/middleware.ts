import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isAdminRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/tests') ||
    pathname.startsWith('/results') ||
    pathname.startsWith('/users');

  if (isAdminRoute && !req.auth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/users') && req.auth?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tests/:path*',
    '/results/:path*',
    '/users/:path*',
  ],
};
