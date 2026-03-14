// app/lib/analytics/timezone-location.ts
'use client';

export function getLocationFromBrowser(): {
  country: string;
  countryCode: string;
  timezone: string;
  language: string;
} {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  
  return {
    country: guessCountryFromTimezone(timezone),
    countryCode: getCountryCodeFromTimezone(timezone),
    timezone,
    language
  };
}

function guessCountryFromTimezone(timezone: string): string {
  const timezoneMap: Record<string, string> = {
    'Asia/Karachi': 'Pakistan',
    'Asia/Kolkata': 'India',
    'Asia/Dhaka': 'Bangladesh',
    'Asia/Colombo': 'Sri Lanka',
    'Asia/Kathmandu': 'Nepal',
    'Asia/Dubai': 'UAE',
    'Asia/Riyadh': 'Saudi Arabia',
    'Asia/Baghdad': 'Iraq',
    'Asia/Tehran': 'Iran',
    'Asia/Jerusalem': 'Israel',
    'Asia/Tokyo': 'Japan',
    'Asia/Shanghai': 'China',
    'Asia/Hong_Kong': 'Hong Kong',
    'Asia/Seoul': 'South Korea',
    'Asia/Singapore': 'Singapore',
    'Asia/Kuala_Lumpur': 'Malaysia',
    'Asia/Jakarta': 'Indonesia',
    'Asia/Manila': 'Philippines',
    'Asia/Bangkok': 'Thailand',
    'Asia/Ho_Chi_Minh': 'Vietnam',
    'Europe/London': 'United Kingdom',
    'Europe/Paris': 'France',
    'Europe/Berlin': 'Germany',
    'Europe/Rome': 'Italy',
    'Europe/Madrid': 'Spain',
    'Europe/Lisbon': 'Portugal',
    'Europe/Amsterdam': 'Netherlands',
    'Europe/Brussels': 'Belgium',
    'Europe/Vienna': 'Austria',
    'Europe/Stockholm': 'Sweden',
    'Europe/Oslo': 'Norway',
    'Europe/Copenhagen': 'Denmark',
    'Europe/Helsinki': 'Finland',
    'Europe/Warsaw': 'Poland',
    'Europe/Prague': 'Czech Republic',
    'Europe/Budapest': 'Hungary',
    'Europe/Athens': 'Greece',
    'Europe/Istanbul': 'Turkey',
    'Europe/Moscow': 'Russia',
    'America/New_York': 'United States',
    'America/Chicago': 'United States',
    'America/Denver': 'United States',
    'America/Los_Angeles': 'United States',
    'America/Toronto': 'Canada',
    'America/Vancouver': 'Canada',
    'America/Mexico_City': 'Mexico',
    'America/Sao_Paulo': 'Brazil',
    'America/Buenos_Aires': 'Argentina',
    'America/Santiago': 'Chile',
    'America/Bogota': 'Colombia',
    'America/Lima': 'Peru',
    'Africa/Cairo': 'Egypt',
    'Africa/Johannesburg': 'South Africa',
    'Africa/Lagos': 'Nigeria',
    'Africa/Nairobi': 'Kenya',
    'Australia/Sydney': 'Australia',
    'Australia/Melbourne': 'Australia',
    'Australia/Brisbane': 'Australia',
    'Australia/Perth': 'Australia',
    'Pacific/Auckland': 'New Zealand',
  };
  
  return timezoneMap[timezone] || 'Unknown';
}

function getCountryCodeFromTimezone(timezone: string): string {
  const codeMap: Record<string, string> = {
    'Asia/Karachi': 'PK',
    'Asia/Kolkata': 'IN',
    'Asia/Dhaka': 'BD',
    'Asia/Colombo': 'LK',
    'Asia/Kathmandu': 'NP',
    'Asia/Dubai': 'AE',
    'Asia/Riyadh': 'SA',
    'Asia/Baghdad': 'IQ',
    'Asia/Tehran': 'IR',
    'Asia/Jerusalem': 'IL',
    'Asia/Tokyo': 'JP',
    'Asia/Shanghai': 'CN',
    'Asia/Hong_Kong': 'HK',
    'Asia/Seoul': 'KR',
    'Asia/Singapore': 'SG',
    'Asia/Kuala_Lumpur': 'MY',
    'Asia/Jakarta': 'ID',
    'Asia/Manila': 'PH',
    'Asia/Bangkok': 'TH',
    'Asia/Ho_Chi_Minh': 'VN',
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Rome': 'IT',
    'Europe/Madrid': 'ES',
    'Europe/Lisbon': 'PT',
    'Europe/Amsterdam': 'NL',
    'Europe/Brussels': 'BE',
    'Europe/Vienna': 'AT',
    'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK',
    'Europe/Helsinki': 'FI',
    'Europe/Warsaw': 'PL',
    'Europe/Prague': 'CZ',
    'Europe/Budapest': 'HU',
    'Europe/Athens': 'GR',
    'Europe/Istanbul': 'TR',
    'Europe/Moscow': 'RU',
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'America/Mexico_City': 'MX',
    'America/Sao_Paulo': 'BR',
    'America/Buenos_Aires': 'AR',
    'America/Santiago': 'CL',
    'America/Bogota': 'CO',
    'America/Lima': 'PE',
    'Africa/Cairo': 'EG',
    'Africa/Johannesburg': 'ZA',
    'Africa/Lagos': 'NG',
    'Africa/Nairobi': 'KE',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'Australia/Brisbane': 'AU',
    'Australia/Perth': 'AU',
    'Pacific/Auckland': 'NZ',
  };
  
  return codeMap[timezone] || 'UN';
}