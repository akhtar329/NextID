import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { trackPageView } from '@/app/lib/analytics/tracker';
import { v4 as uuidv4 } from 'uuid';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  });
  
  const { pathname } = request.nextUrl;
  
  // ==================== 1. ANALYTICS TRACKING ====================
  // Skip tracking for static files and API routes
  const shouldTrack = !pathname.startsWith('/_next') && 
                     !pathname.startsWith('/api') &&
                     !pathname.startsWith('/static') &&
                     !pathname.includes('.') &&
                     pathname !== '/favicon.ico';
  
  if (shouldTrack) {
    try {
      // Get cookies for visitor/session IDs
      const cookies = request.headers.get('cookie') || '';
      
      // Parse visitor ID from cookies
      let visitorId = getCookieValue(cookies, 'visitor_id');
      const isNewVisitor = !visitorId;
      if (!visitorId) {
        visitorId = uuidv4();
      }
      
      // Parse session ID from cookies
      let sessionId = getCookieValue(cookies, 'session_id');
      const isNewSession = !sessionId;
      if (!sessionId) {
        sessionId = uuidv4();
      }
      
      // Create visitor info for tracking
      const visitorInfo = {
        visitorId,
        sessionId,
        isNewVisitor,
        isNewSession
      };
      
      // Get basic device info from user agent
      const userAgent = request.headers.get('user-agent') || '';
      const deviceInfo = getBasicDeviceInfo(userAgent);
      
      // Create page view data
      const pageData = {
        pagePath: pathname,
        pageTitle: '', // Will be set client-side
        referrer: request.headers.get('referer') || 'direct',
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        screenSize: '0x0', // Unknown on server
        timestamp: new Date().toISOString(),
      };
      
      // Track page view (don't await to not block)
      trackPageView(visitorInfo, pageData).catch((err: Error) => 
        console.error('Analytics tracking error:', err.message)
      );
      
      // Set cookies for future requests
      const response = NextResponse.next();
      
      if (isNewVisitor) {
        response.cookies.set('visitor_id', visitorId, {
          maxAge: 365 * 24 * 60 * 60, // 1 year
          path: '/',
        });
      }
      
      if (isNewSession) {
        response.cookies.set('session_id', sessionId, {
          maxAge: 30 * 60, // 30 minutes
          path: '/',
        });
      }
      
      // Continue with the response
      return response;
      
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }
  
  // ==================== 2. X-ROBOTS-TAG HEADERS ====================
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

  // ==================== 3. AUTH PROTECTION ====================
  // Protected routes
  const isProtectedRoute = [
    '/dashboard',
    '/profile', 
    '/settings',
    '/admin'
  ].some(route => pathname.startsWith(route));
  
  console.log(`Middleware - Path: ${pathname}, Token: ${!!token}, Protected: ${isProtectedRoute}`);
  
  // If accessing protected route without token
  if (isProtectedRoute && !token) {
    console.log('Redirecting to login - No token');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If accessing login with valid token
  if (pathname === '/login' && token) {
    console.log('Already logged in - Redirecting to dashboard');
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  return response;
}

/**
 * Helper function to get cookie value
 */
function getCookieValue(cookies: string, name: string): string | null {
  const match = cookies.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

/**
 * Get basic device info from user agent (server-side)
 */
function getBasicDeviceInfo(ua: string) {
  return {
    deviceType: getDeviceType(ua),
    browser: getBrowser(ua),
    os: getOS(ua),
  };
}

function getDeviceType(ua: string): string {
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowser(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return 'Other';
}

function getOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
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