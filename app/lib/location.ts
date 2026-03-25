// app/lib/location.ts
// 📍 IP Address se location detect karne wali utility

export interface LocationInfo {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: string;
  longitude: string;
  timezone: string;
}

/**
 * IP address se location data fetch karta hai
 * @param ip - Visitor ka IP address
 * @returns LocationInfo object ya null
 */
export async function getLocationFromIP(ip: string): Promise<LocationInfo | null> {
  try {
    // 📌 Localhost/development IPs ke liye fake data return karo
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'Pakistan',
        countryCode: 'PK',
        city: 'Karachi',
        region: 'Sindh',
        latitude: '24.8607',
        longitude: '67.0011',
        timezone: 'Asia/Karachi'
      };
    }

    // ✅ FIXED: AbortController se timeout implement karo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    // 📌 Public API se location fetch karo (ip-api.com - free, no API key needed)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,regionName,lat,lon,timezone`, {
      signal: controller.signal // ✅ AbortController ka signal do
    });

    clearTimeout(timeoutId); // Timeout clear karo

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'UN',
        city: data.city || 'Unknown',
        region: data.regionName || 'Unknown',
        latitude: data.lat?.toString() || '0',
        longitude: data.lon?.toString() || '0',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }

    console.warn('⚠️ Location API returned non-success status:', data);
    return null;
    
  } catch (error: any) {
    // ✅ FIXED: Timeout error handle karo
    if (error.name === 'AbortError') {
      console.error('❌ Location fetch timeout after 3 seconds');
    } else {
      console.error('❌ Location fetch error:', error);
    }
    
    // Fallback - browser ki timezone se country guess karo
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
      country: guessCountryFromTimezone(timezone),
      countryCode: 'UN',
      city: 'Unknown',
      region: 'Unknown',
      latitude: '0',
      longitude: '0',
      timezone: timezone
    };
  }
}

/**
 * Timezone se country guess karne ka fallback function
 */
function guessCountryFromTimezone(timezone: string): string {
  const timezoneMap: Record<string, string> = {
    'Asia/Karachi': 'Pakistan',
    'Asia/Kolkata': 'India',
    'Asia/Dhaka': 'Bangladesh',
    'Asia/Dubai': 'UAE',
    'Asia/Riyadh': 'Saudi Arabia',
    'Europe/London': 'United Kingdom',
    'America/New_York': 'United States',
    'America/Chicago': 'United States',
    'America/Denver': 'United States',
    'America/Los_Angeles': 'United States',
    'Australia/Sydney': 'Australia',
    'Europe/Berlin': 'Germany',
    'Europe/Paris': 'France',
    'Asia/Tokyo': 'Japan',
    'Asia/Shanghai': 'China'
  };
  
  return timezoneMap[timezone] || 'Unknown';
}

/**
 * Client-side location detection (browser se)
 * Agar IP API kaam na kare to client-side info use karo
 */
export function getClientLocation(): Partial<LocationInfo> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  
  let countryCode = 'UN';
  if (language.includes('-')) {
    countryCode = language.split('-')[1].toUpperCase();
  }
  
  return {
    countryCode,
    timezone
  };
}