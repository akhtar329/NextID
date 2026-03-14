// app/component/analyticstraker/AnalyticsTracker.tsx
'use client';

import { useEffect, useRef } from 'react'; // ✅ ADDED: useEffect import
import { usePathname, useSearchParams } from 'next/navigation';
import { getVisitorInfo, getPageViewData, trackPageView, updateSession } from '@/app/lib/analytics/tracker'; // ✅ ADDED: functions import

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string>('');
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
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
        
        // Don't track if it's the same page (maybe just hash change)
        if (previousPathRef.current === pathname) {
          return;
        }
        
        // Track page view
        await trackPageView(visitorInfo, pageData);
        
        // Update previous path
        previousPathRef.current = pathname;
        
        console.log('📊 Analytics tracked:', {
          path: pathname,
          visitor: visitorInfo.visitorId.slice(0, 8) + '...',
          session: visitorInfo.sessionId.slice(0, 8) + '...'
        });
        
      } catch (error) {
        // Silent fail - don't break the site
        console.debug('Analytics track error:', error);
      }
    };

    trackPageViewData();

    // Heartbeat - session alive rakho (har 30 sec)
    if (!heartbeatIntervalRef.current) {
      heartbeatIntervalRef.current = setInterval(async () => {
        try {
          const visitorInfo = getVisitorInfo();
          await updateSession(visitorInfo);
        } catch (error) {
          // Silent fail
        }
      }, 30000); // 30 seconds
    }

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = undefined;
      }
      
      // Final session update on page leave
      const visitorInfo = getVisitorInfo();
      updateSession(visitorInfo);
    };
  }, [pathname, searchParams]); // Re-run when path or params change

  // Scroll tracking (optional)
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | undefined;
    let maxScroll = 0;
    
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }
      
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        if (maxScroll > 0) {
          // Track scroll depth (optional)
        }
      }, 1000);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  // Time on page tracking
  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent > 5) {
        console.log(`⏱️ Time on ${pathname}: ${timeSpent}s`);
      }
    };
  }, [pathname]);

  return null;
}