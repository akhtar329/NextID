// app/lib/analytics/client-tracker.ts
'use client';

import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';

interface VisitorInfo {
  visitorId: string;
  sessionId: string;
  isNewVisitor: boolean;
}

/**
 * Visitor aur session IDs manage karta hai
 */
export function getVisitorInfo(): VisitorInfo {
  if (typeof window === 'undefined') {
    return {
      visitorId: '',
      sessionId: '',
      isNewVisitor: false,
    };
  }

  // localStorage se visitorId
  let visitorId = localStorage.getItem('visitor_id');
  const isNewVisitor = !visitorId;
  
  if (!visitorId) {
    visitorId = uuidv4();
    localStorage.setItem('visitor_id', visitorId);
    localStorage.setItem('visitor_first_seen', new Date().toISOString());
  }
  
  // sessionStorage se sessionId (har 30 min mein naya session)
  let sessionId = sessionStorage.getItem('session_id');
  const sessionStart = sessionStorage.getItem('session_start');
  const now = Date.now();
  
  // Check if session expired (30 minutes)
  if (!sessionId || !sessionStart || (now - parseInt(sessionStart)) > 30 * 60 * 1000) {
    sessionId = uuidv4();
    sessionStorage.setItem('session_id', sessionId);
    sessionStorage.setItem('session_start', now.toString());
  }
  
  return { visitorId, sessionId, isNewVisitor };
}

/**
 * Device info detect karo
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'server',
      browser: 'server',
      os: 'server',
      screenSize: '0x0',
    };
  }

  const ua = navigator.userAgent;
  
  return {
    deviceType: getDeviceType(ua),
    browser: getBrowser(ua),
    os: getOS(ua),
    screenSize: `${window.screen.width}x${window.screen.height}`,
  };
}

/**
 * User Agent se device type detect karo
 */
function getDeviceType(ua: string): string {
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * User Agent se browser detect karo
 */
function getBrowser(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('MSIE') || ua.includes('Trident')) return 'Internet Explorer';
  return 'Other';
}

/**
 * User Agent se OS detect karo
 */
function getOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
}

/**
 * Track page view - API ko call karega
 */
export async function trackPageView(path?: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const { visitorId, sessionId, isNewVisitor } = getVisitorInfo();
    const deviceInfo = getDeviceInfo();
    
    const pageData = {
      visitorId,
      sessionId,
      isNewVisitor,
      pagePath: path || window.location.pathname,
      pageTitle: document.title,
      referrer: document.referrer || 'direct',
      ...deviceInfo,
      timestamp: new Date().toISOString(),
    };
    
    // Send to API (don't await to not block)
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pageData),
      keepalive: true, // Important for page unload
    }).catch(err => console.debug('Analytics error:', err));
    
  } catch (error) {
    // Silent fail - analytics se website impact na ho
    console.debug('Analytics tracking error:', error);
  }
}

/**
 * React hook for automatic page view tracking
 */
export function usePageViewTracking() {
  const [tracked, setTracked] = useState(false);
  
  useEffect(() => {
    if (tracked) return;
    
    // Track initial page view
    trackPageView();
    setTracked(true);
    
    // Track page views on route change (for client-side navigation)
    const handleRouteChange = () => {
      trackPageView();
    };
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [tracked]);
}

/**
 * Track custom events
 */
export async function trackEvent(eventName: string, eventData?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  try {
    const { visitorId, sessionId } = getVisitorInfo();
    
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        sessionId,
        eventName,
        eventData,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    });
  } catch (error) {
    console.debug('Event tracking error:', error);
  }
}