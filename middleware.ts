// app/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;
  
  // ==================== PUBLIC ANALYTICS ENDPOINTS ====================
  // ✅ Ye endpoints public hain - No authentication required
  const publicAnalyticsPaths = [
    '/api/admin/analytics/track',
    '/api/admin/analytics/session',
  ];
  
  // Agar public analytics endpoint hai, toh directly allow karo
  if (publicAnalyticsPaths.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next();
    // Add CORS headers for analytics
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  }
  
  // ==================== API ROUTES PROTECTION ====================
  // Admin API routes ko protect karo (except analytics)
  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }
  
  // ==================== X-ROBOTS-TAG HEADERS ====================
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

  // ==================== PAGE ROUTES PROTECTION ====================
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
    // Analytics endpoints (must come first in matcher)
    '/api/admin/analytics/track',
    '/api/admin/analytics/session',
    // Other routes
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
    '/api/admin/:path*',
    '/login'
  ]
}