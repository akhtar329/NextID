// app/lib/analytics/tracker.ts
'use client';

import { v4 as uuidv4 } from 'uuid';

// Safe browser check for SSR
const isBrowser = typeof window !== 'undefined';

export interface VisitorInfo {
  visitorId: string;
  sessionId: string;
  isNewVisitor: boolean;
  isNewSession: boolean;
}

export interface PageViewData {
  pagePath: string;
  pageTitle: string;
  referrer: string;
  deviceType: string;
  browser: string;
  os: string;
  screenSize: string;
  timestamp: string;
}

/**
 * Visitor aur session IDs manage karta hai
 */
export function getVisitorInfo(): VisitorInfo {
  // SSR ke liye default values
  if (!isBrowser) {
    return {
      visitorId: 'ssr-placeholder',
      sessionId: 'ssr-placeholder',
      isNewVisitor: false,
      isNewSession: false,
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
  
  // sessionStorage se sessionId
  let sessionId = sessionStorage.getItem('session_id');
  const isNewSession = !sessionId;
  
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('session_id', sessionId);
    sessionStorage.setItem('session_start', Date.now().toString());
  }
  
  return { visitorId, sessionId, isNewVisitor, isNewSession };
}

/**
 * Page view data collect karta hai
 */
export function getPageViewData(path: string): PageViewData {
  // SSR ke liye default values
  if (!isBrowser) {
    return {
      pagePath: path,
      pageTitle: '',
      referrer: '',
      deviceType: 'server',
      browser: 'server',
      os: 'server',
      screenSize: '0x0',
      timestamp: new Date().toISOString(),
    };
  }

  const ua = navigator.userAgent;
  
  return {
    pagePath: path,
    pageTitle: document.title,
    referrer: document.referrer || 'direct',
    deviceType: getDeviceType(ua),
    browser: getBrowser(ua),
    os: getOS(ua),
    screenSize: `${window.screen.width}x${window.screen.height}`,
    timestamp: new Date().toISOString(),
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
export async function trackPageView(visitorInfo: VisitorInfo, pageData: PageViewData) {
  // SSR mein skip karo
  if (!isBrowser) return;
  
  try {
    const response = await fetch('/api/admin/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...visitorInfo,
        ...pageData,
      }),
      keepalive: true,
    });
    
    if (!response.ok) {
      console.warn('⚠️ Analytics track failed:', await response.text());
    }
  } catch (error) {
    // Silent fail - analytics se website impact na ho
    console.debug('Analytics error (silent):', error);
  }
}

/**
 * Session update - heartbeat
 */
export async function updateSession(visitorInfo: VisitorInfo) {
  // SSR mein skip karo
  if (!isBrowser) return;
  
  try {
    await fetch('/api/admin/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitorInfo),
      keepalive: true,
    });
  } catch (error) {
    // Silent fail
  }
}