// app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  });
  
  const { pathname } = request.nextUrl;
  
  // ==================== 1. X-ROBOTS-TAG HEADERS ====================
  const response = NextResponse.next();
  
  // Public pages - Index karo (SEO ke liye)
  if (pathname === '/' || 
      pathname.startsWith('/admissions') ||
      pathname.startsWith('/universities') ||
      pathname.startsWith('/programs') ||
      pathname.startsWith('/results') ||
      pathname.startsWith('/boards') ||
      pathname.startsWith('/news') ||
      pathname.startsWith('/cities')) {
    response.headers.set(
      'X-Robots-Tag', 
      'index, follow, max-image-preview:large, max-snippet:160'
    );
  }
  
  // Admin pages - Noindex
  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  
  // Login page - Noindex
  if (pathname === '/login') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // ==================== 2. AUTH PROTECTION ====================
  // Protected routes
  const isProtectedRoute = [
    '/dashboard',
    '/profile', 
    '/settings',
    '/admin'
  ].some(route => pathname.startsWith(route));
  
  // If accessing protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If accessing login with valid token
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    '/',
    '/admissions/:path*',
    '/universities/:path*',
    '/programs/:path*',
    '/results/:path*',
    '/boards/:path*',
    '/news/:path*',
    '/cities/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/login'
  ]
}