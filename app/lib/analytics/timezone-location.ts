// app/lib/analytics/timezone-location.ts
'use client';

export function getLocationFromBrowser(): {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  timezone: string;
  language: string;
} {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  
  return {
    country: guessCountryFromTimezone(timezone),
    countryCode: getCountryCodeFromTimezone(timezone),
    city: guessCityFromTimezone(timezone),
    region: guessRegionFromTimezone(timezone),
    timezone,
    language
  };
}

function guessCountryFromTimezone(timezone: string): string {
  const timezoneMap: Record<string, string> = {
    'Asia/Karachi': 'Pakistan',
    'Asia/Kolkata': 'India',
    'Asia/Dhaka': 'Bangladesh',
    // ... add more
  };
  return timezoneMap[timezone] || 'Unknown';
}

function getCountryCodeFromTimezone(timezone: string): string {
  const codeMap: Record<string, string> = {
    'Asia/Karachi': 'PK',
    'Asia/Kolkata': 'IN',
    // ... add more
  };
  return codeMap[timezone] || 'UN';
}

function guessCityFromTimezone(timezone: string): string {
  const cityMap: Record<string, string> = {
    'Asia/Karachi': 'Karachi',
    'Asia/Kolkata': 'Mumbai',
    // ... add more
  };
  return cityMap[timezone] || 'Unknown';
}

function guessRegionFromTimezone(timezone: string): string {
  const regionMap: Record<string, string> = {
    'Asia/Karachi': 'Sindh',
    'Asia/Kolkata': 'Maharashtra',
    
  };
  return regionMap[timezone] || 'Unknown';
}