'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
  const pathname = usePathname();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackedPageRef = useRef<string>('');
  const lastTrackedTimeRef = useRef<number>(0);

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
        console.log('🆕 New session created:', sessionId);
      } else {
        console.log('♻️ Existing session:', sessionId);
      }

      // ✅ Client-side duplicate check (prevents rapid refresh counts)
      const now = Date.now();
      const isSamePage = lastTrackedPageRef.current === pathname;
      const isWithin30Seconds = (now - lastTrackedTimeRef.current) < 30000;
      
      if (isSamePage && isWithin30Seconds) {
        console.log('⏭️ Skipping duplicate track (same page within 30 seconds):', pathname);
        return;
      }
      
      lastTrackedPageRef.current = pathname || '/';
      lastTrackedTimeRef.current = now;

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

      // ========== DOUBLE SYSTEM: GPS + IP FALLBACK ==========
      let country = null, city = null, latitude = null, longitude = null;

      const locationFetched = sessionStorage.getItem('location_fetched');
      if (!locationFetched) {
        
        // TRY 1: GPS LOCATION (Exact)
        let gpsSuccess = false;
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
            gpsSuccess = true;
            
            // Get city name from coordinates
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              city = geoData.city || geoData.locality;
              country = geoData.countryName;
            }
            console.log('📍 GPS location found:', city, country);
          } catch (gpsError) {
            console.log('❌ GPS failed or denied, trying IP fallback...');
          }
        }
        
        // TRY 2: IP FALLBACK (City level - No permission needed)
        if (!gpsSuccess) {
          try {
            const ipRes = await fetch('https://ipapi.co/json/');
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              city = ipData.city;
              country = ipData.country_name;
              latitude = ipData.latitude;
              longitude = ipData.longitude;
              console.log('📍 IP fallback location:', city, country);
            } else {
              // Try alternative API
              const altRes = await fetch('https://freeipapi.com/api/json/');
              if (altRes.ok) {
                const altData = await altRes.json();
                city = altData.city;
                country = altData.country;
                latitude = altData.latitude;
                longitude = altData.longitude;
                console.log('📍 Alternative IP location:', city, country);
              }
            }
          } catch (ipError) {
            console.log('❌ IP fallback failed');
          }
        }
        
        // Store in sessionStorage to avoid repeated calls
        sessionStorage.setItem('location_fetched', 'true');
        if (city) sessionStorage.setItem('visitor_city', city);
        if (country) sessionStorage.setItem('visitor_country', country);
        if (latitude) sessionStorage.setItem('visitor_lat', String(latitude));
        if (longitude) sessionStorage.setItem('visitor_lng', String(longitude));
        
      } else {
        // Use stored location
        city = sessionStorage.getItem('visitor_city');
        country = sessionStorage.getItem('visitor_country');
        latitude = sessionStorage.getItem('visitor_lat') ? parseFloat(sessionStorage.getItem('visitor_lat')!) : null;
        longitude = sessionStorage.getItem('visitor_lng') ? parseFloat(sessionStorage.getItem('visitor_lng')!) : null;
      }

      // ✅ Track page view
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
        console.log('📊 Track result:', result.isDuplicate ? 'Duplicate (not counted)' : 'New view counted');
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
            // Heartbeat successful
          }
        }
      } catch (e) {
        // Silent fail
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

// ✅ Required for TypeScript module
export {};