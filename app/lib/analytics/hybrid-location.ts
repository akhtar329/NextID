// app/lib/analytics/hybrid-location.ts
'use client';

import { getLocationFromIP } from '../location';
import { getLocationFromBrowser } from './timezone-location';

export interface ExactLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  region?: string;        // 👈 Add region
  country?: string;
  countryCode?: string;
}

export interface HybridLocation {
  country: string;
  countryCode: string;
  city: string;
  region: string;         // 👈 Add region
  latitude: string;
  longitude: string;
  timezone?: string;
  accuracy?: number;
  source: string;
}

/**
 * Browser's Geolocation API se exact location lena
 */
export async function getExactLocation(): Promise<ExactLocation | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
          );
          const data = await response.json();
          
          resolve({
            ...location,
            city: data.address?.city || data.address?.town || data.address?.village,
            region: data.address?.state || data.address?.region,  // 👈 Add region
            country: data.address?.country,
            countryCode: data.address?.country_code?.toUpperCase()
          });
        } catch (error) {
          resolve(location);
        }
      },
      (error) => {
        console.debug('Geolocation error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Hybrid approach - best available location
 * 1️⃣ Exact location (agar user allow kare)
 * 2️⃣ Timezone + Language (no permission)
 * 3️⃣ IP-based (fallback)
 */
export async function getHybridLocation(): Promise<HybridLocation> {
  // Pehle browser exact location try karo
  if (typeof navigator !== 'undefined' && navigator.permissions) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'granted') {
        const exactLocation = await getExactLocation();
        if (exactLocation) {
          return {
            country: exactLocation.country || 'Unknown',
            countryCode: exactLocation.countryCode || 'UN',
            city: exactLocation.city || 'Unknown',
            region: exactLocation.region || 'Unknown',  // 👈 Add region
            latitude: exactLocation.latitude.toString(),
            longitude: exactLocation.longitude.toString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            accuracy: exactLocation.accuracy,
            source: 'gps'
          };
        }
      }
    } catch (e) {
      console.debug('Permission API not supported');
    }
  }
  
  // Fallback 1: Timezone + Language
  try {
    const browserInfo = getLocationFromBrowser();
    if (browserInfo.country !== 'Unknown') {
      return {
        country: browserInfo.country,
        countryCode: browserInfo.countryCode,
        city: browserInfo.city || 'Unknown',
        region: browserInfo.region || 'Unknown',  // 👈 Add region
        latitude: '0',
        longitude: '0',
        timezone: browserInfo.timezone,
        source: 'timezone'
      };
    }
  } catch (e) {
    console.debug('Timezone detection failed');
  }
  
  // Fallback 2: IP-based location
  try {
    const ipResponse = await fetch('/api/analytics/my-ip').catch(() => null);
    if (ipResponse && ipResponse.ok) {
      const ip = await ipResponse.text();
      const ipLocation = await getLocationFromIP(ip);
      if (ipLocation) {
        return {
          country: ipLocation.country || 'Unknown',
          countryCode: ipLocation.countryCode || 'UN',
          city: ipLocation.city || 'Unknown',
          region: ipLocation.region || 'Unknown',  // 👈 Add region
          latitude: ipLocation.latitude || '0',
          longitude: ipLocation.longitude || '0',
          timezone: ipLocation.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: 'ip'
        };
      }
    }
  } catch (e) {
    console.debug('IP location failed');
  }
  
  // Ultimate fallback - Pakistan default
  return {
    country: 'Pakistan',
    countryCode: 'PK',
    city: 'Karachi',
    region: 'Sindh',  // 👈 Add region
    latitude: '24.8607',
    longitude: '67.0011',
    timezone: 'Asia/Karachi',
    source: 'fallback'
  };
}