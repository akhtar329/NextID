// app/lib/analytics/hybrid-location.ts
'use client';

import { getLocationFromIP } from '../location';
import { getLocationFromBrowser } from './timezone-location';

export interface ExactLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  country?: string;
  countryCode?: string;
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
        // Success - exact location mil gayi
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        
        // Reverse geocoding se city/country bhi le lo
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
          );
          const data = await response.json();
          
          resolve({
            ...location,
            city: data.address?.city || data.address?.town || data.address?.village,
            country: data.address?.country,
            countryCode: data.address?.country_code?.toUpperCase()
          });
        } catch (error) {
          // Reverse geocoding fail - sirf coordinates return karo
          resolve(location);
        }
      },
      (error) => {
        // Error ya user ne permission deny kar di
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
export async function getHybridLocation() {
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
            latitude: exactLocation.latitude.toString(),
            longitude: exactLocation.longitude.toString(),
            accuracy: exactLocation.accuracy,
            source: 'gps'
          };
        }
      }
    } catch (e) {
      // Permission API not supported - continue to fallback
      console.debug('Permission API not supported');
    }
  }
  
  // Fallback 1: Timezone + Language
  try {
    const browserInfo = getLocationFromBrowser();
    if (browserInfo.country !== 'Unknown') {
      return {
        ...browserInfo,
        city: 'Unknown',
        source: 'timezone'
      };
    }
  } catch (e) {
    console.debug('Timezone detection failed');
  }
  
  // Fallback 2: IP-based location
  try {
    // Client IP fetch karne ka API call
    const ipResponse = await fetch('/api/analytics/my-ip').catch(() => null);
    if (ipResponse && ipResponse.ok) {
      const ip = await ipResponse.text();
      const ipLocation = await getLocationFromIP(ip);
      if (ipLocation) {
        return {
          ...ipLocation,
          source: 'ip'
        };
      }
    }
  } catch (e) {
    console.debug('IP location failed');
  }
  
  // Ultimate fallback
  return {
    country: 'Unknown',
    countryCode: 'UN',
    city: 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    source: 'unknown'
  };
}