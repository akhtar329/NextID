// app/component/analyticstraker/AnalyticsTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getVisitorInfo, getPageViewData, trackPageView, updateSession } from '@/app/lib/analytics/tracker';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string>('');
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isMounted = useRef(false);

  useEffect(() => {
    // ✅ IMPORTANT: Skip during SSR/Prerendering
    if (typeof window === 'undefined') return;
    
    isMounted.current = true;

    // Skip analytics for admin and api routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    const trackPageViewData = async () => {
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
        // Silent fail
      }
    };

    trackPageViewData();

    // Heartbeat
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

    return () => {
      isMounted.current = false;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = undefined;
      }
    };
  }, [pathname, searchParams]);

  return null;
}