export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from './app/lib/db';
import { redirects } from './app/lib/schema';
import { eq } from 'drizzle-orm';
import { getCachedRedirect, setCachedRedirect } from '@/app/lib/cache';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const { pathname, host } = request.nextUrl;
  
  // ==================== REDIRECT CHECK ====================
  const skipPaths = ['/api/admin', '/admin', '/_next', '/favicon.ico', '/login'];
  const shouldSkipRedirect = skipPaths.some(path => pathname.startsWith(path));
  
  if (!shouldSkipRedirect && !pathname.includes('.')) {
    try {
      // Get base URL from request
      const baseUrl = `${request.nextUrl.protocol}//${host}`;
      
      // Create possible full URL patterns to check
      const possiblePaths = [
        pathname,                                    // /colleges/1
        `${baseUrl}${pathname}`,                    // http://localhost:3000/colleges/1
        `https://nextid.pk${pathname}`,             // https://nextid.pk/colleges/1
        pathname.replace(/^\//, ''),                // colleges/1
      ];
      
      let redirectRule = null;
      
      // Check cache first
      for (const checkPath of possiblePaths) {
        redirectRule = getCachedRedirect(checkPath);
        if (redirectRule !== undefined) break;
      }
      
      // If not in cache, check database
      if (redirectRule === undefined) {
        for (const checkPath of possiblePaths) {
          redirectRule = await db
            .select()
            .from(redirects)
            .where(eq(redirects.fromPath, checkPath))
            .then(res => res[0]);
          
          if (redirectRule) {
            // Store in cache with the matched path
            setCachedRedirect(checkPath, redirectRule);
            break;
          }
        }
        
        // Cache miss for all patterns
        if (!redirectRule) {
          setCachedRedirect(pathname, null);
        }
      }
      
      if (redirectRule && redirectRule.status) {
        // Update hit count
        db.update(redirects)
          .set({ 
            hitCount: (redirectRule.hitCount || 0) + 1,
            lastHit: new Date()
          })
          .where(eq(redirects.id, redirectRule.id))
          .catch(err => console.error('Error updating hit count:', err));
        
        // Extract destination path from full URL if needed
        let destination = redirectRule.toPath;
        if (destination.startsWith('http')) {
          // If it's a full URL, extract just the path
          try {
            const destUrl = new URL(destination);
            destination = destUrl.pathname;
          } catch (e) {
            // Keep as is
          }
        }
        
        console.log(`🔄 Redirecting: ${pathname} → ${destination}`);
        
        return NextResponse.redirect(new URL(destination, request.url), {
          status: redirectRule.statusCode as 301 | 302
        });
      }
    } catch (error) {
      console.error('Redirect middleware error:', error);
    }
  }
  
  // ==================== REST OF YOUR MIDDLEWARE ====================
  // ... (keep your existing code for analytics, API protection, etc.)
  
  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: [
    '/',
    '/colleges/:path*',
    '/admissions/:path*',
    '/universities/:path*',
    '/programs/:path*',
    '/results/:path*',
    '/boards/:path*',
    '/news/:path*',
    '/cities/:path*',
    '/api/admin/analytics/track',
    '/api/admin/analytics/session',
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/login'
  ]
};