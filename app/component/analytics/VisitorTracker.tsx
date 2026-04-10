// app/component/analytics/VisitorTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
  const pathname = usePathname();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    const trackPageView = async () => {
      
      let visitorId = localStorage.getItem('visitor_id');
      if (!visitorId) {
        visitorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('visitor_id', visitorId);
      }

      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('session_id', sessionId);
      }

      // Device info
      const userAgent = navigator.userAgent;
      let deviceType = 'desktop';
      if (/mobile/i.test(userAgent)) deviceType = 'mobile';
      else if (/tablet/i.test(userAgent)) deviceType = 'tablet';

      let browser = 'Unknown';
      if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
      else if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
      else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
      else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';

      let os = 'Unknown';
      if (userAgent.indexOf('Windows') > -1) os = 'Windows';
      else if (userAgent.indexOf('Mac') > -1) os = 'MacOS';
      else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
      else if (userAgent.indexOf('Android') > -1) os = 'Android';
      else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1) os = 'iOS';

      // Get location
      let country = null, city = null, latitude = null, longitude = null;

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          
          // Get city name from coordinates
          const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            city = geoData.city || geoData.locality;
            country = geoData.countryName;
          }
        } catch (e) {

        }
      }

      // ✅ Track page view (updates last_active)
      try {
        const response = await fetch('/api/admin/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId,
            sessionId,
            pagePath: pathname || '/',
            pageTitle: document.title,
            referrer: document.referrer || null,
            deviceType,
            browser,
            os,
            country,
            city,
            latitude: latitude ? String(latitude) : null,
            longitude: longitude ? String(longitude) : null,
          }),
        });
        const result = await response.json();
       
      } catch (e) {
        console.error('Track error:', e);
      }
    };

    // ✅ Send heartbeat to keep session alive
    const sendHeartbeat = async () => {
      try {
        const sessionId = sessionStorage.getItem('session_id');
        const visitorId = localStorage.getItem('visitor_id');
        
        if (sessionId) {
          const response = await fetch('/api/admin/analytics/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              visitorId,
              action: 'heartbeat'
            }),
          });
          const result = await response.json();
          if (result.success) {
          }
        }
      } catch (e) {

      }
    };

    // Initial track
    trackPageView();

    // ✅ Start heartbeat interval (every 30 seconds)
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

    // ✅ Handle page/tab close
    const handleBeforeUnload = async () => {
      const sessionId = sessionStorage.getItem('session_id');
      const visitorId = localStorage.getItem('visitor_id');
      
      if (sessionId) {
        await fetch('/api/admin/analytics/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            visitorId,
            action: 'end'
          }),
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname]);

  return null;
}