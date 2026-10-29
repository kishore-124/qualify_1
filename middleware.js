import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifyToken } from './lib/jwt';

// Route protection rules (pages only — API routes do their own checks)
const RULES = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/instructor', roles: ['INSTRUCTOR', 'ADMIN'] },
  { prefix: '/dashboard' },
  { prefix: '/learn' },
  { prefix: '/wishlist' },
  { prefix: '/checkout' },
  { prefix: '/profile' },
];

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'));
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  // Logged-in users don't need the auth pages
  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (!rule) return NextResponse.next();

  if (!session) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  if (rule.roles && !rule.roles.includes(session.role)) {
    return NextResponse.redirect(new URL(session.role === 'STUDENT' ? '/profile?becomeInstructor=1' : '/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/instructor/:path*', '/dashboard/:path*', '/learn/:path*', '/wishlist', '/checkout/:path*', '/profile', '/login', '/register'],
};
