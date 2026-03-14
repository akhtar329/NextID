// app/component/analyticstraker/AnalyticsTracker.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getVisitorInfo, getPageViewData, trackPageView, updateSession } from '@/app/lib/analytics/tracker';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string>('');
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isMounted = useRef(false);
  const initialized = useRef(false);

  // Memoized track function to prevent recreations
  const trackPageViewData = useCallback(async () => {
    try {
      // Visitor info (localStorage/sessionStorage se)
      const visitorInfo = getVisitorInfo();
      
      // Page view data
      const pageData = getPageViewData(pathname);
      
      // Add URL parameters if present
      if (searchParams.toString()) {
        pageData.pagePath = `${pathname}?${searchParams.toString()}`;
      }
      
      // Don't track if it's the same page
      if (previousPathRef.current === pathname) {
        return;
      }
      
      // Track page view
      await trackPageView(visitorInfo, pageData);
      
      // Update previous path
      previousPathRef.current = pathname;
      
    } catch (error) {
      // Silent fail - don't break the site
      if (process.env.NODE_ENV === 'development') {
        console.debug('Analytics track error:', error);
      }
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // ✅ CRITICAL: Skip during SSR/Prerendering
    if (typeof window === 'undefined') return;
    
    // ✅ Prevent double initialization
    if (initialized.current) return;
    initialized.current = true;
    
    isMounted.current = true;

    // Skip analytics for admin and api routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    // Track initial page view
    trackPageViewData();

    // Heartbeat - session alive rakho (har 30 sec)
    if (!heartbeatIntervalRef.current) {
      heartbeatIntervalRef.current = setInterval(async () => {
        if (!isMounted.current) return;
        try {
          const visitorInfo = getVisitorInfo();
          await updateSession(visitorInfo);
        } catch (error) {
          // Silent fail
        }
      }, 30000);
    }

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      initialized.current = false;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = undefined;
      }
      
      // Final session update on page leave (optional)
      const visitorInfo = getVisitorInfo();
      updateSession(visitorInfo).catch(() => {});
    };
  }, [pathname, searchParams, trackPageViewData]); // Added trackPageViewData dependency

  return null;
}