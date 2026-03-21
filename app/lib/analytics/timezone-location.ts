// app/lib/analytics/timezone-location.ts
'use client';

// Timezone to location mapping (automated)
const timezoneMap: Record<string, { country: string; countryCode: string; city: string; region: string }> = {
  // ==================== PAKISTAN ====================
  'Asia/Karachi': { country: 'Pakistan', countryCode: 'PK', city: 'Karachi', region: 'Sindh' },
  'Asia/Lahore': { country: 'Pakistan', countryCode: 'PK', city: 'Lahore', region: 'Punjab' },
  'Asia/Islamabad': { country: 'Pakistan', countryCode: 'PK', city: 'Islamabad', region: 'ICT' },
  
  // ==================== INDIA ====================
  'Asia/Kolkata': { country: 'India', countryCode: 'IN', city: 'Kolkata', region: 'West Bengal' },
  'Asia/Mumbai': { country: 'India', countryCode: 'IN', city: 'Mumbai', region: 'Maharashtra' },
  'Asia/Delhi': { country: 'India', countryCode: 'IN', city: 'Delhi', region: 'Delhi' },
  'Asia/Chennai': { country: 'India', countryCode: 'IN', city: 'Chennai', region: 'Tamil Nadu' },
  'Asia/Bangalore': { country: 'India', countryCode: 'IN', city: 'Bangalore', region: 'Karnataka' },
  'Asia/Hyderabad': { country: 'India', countryCode: 'IN', city: 'Hyderabad', region: 'Telangana' },
  'Asia/Ahmedabad': { country: 'India', countryCode: 'IN', city: 'Ahmedabad', region: 'Gujarat' },
  'Asia/Pune': { country: 'India', countryCode: 'IN', city: 'Pune', region: 'Maharashtra' },
  'Asia/Jaipur': { country: 'India', countryCode: 'IN', city: 'Jaipur', region: 'Rajasthan' },
  'Asia/Lucknow': { country: 'India', countryCode: 'IN', city: 'Lucknow', region: 'Uttar Pradesh' },
  
  // ==================== MIDDLE EAST ====================
  'Asia/Dubai': { country: 'UAE', countryCode: 'AE', city: 'Dubai', region: 'Dubai' },
  'Asia/Abu Dhabi': { country: 'UAE', countryCode: 'AE', city: 'Abu Dhabi', region: 'Abu Dhabi' },
  'Asia/Riyadh': { country: 'Saudi Arabia', countryCode: 'SA', city: 'Riyadh', region: 'Riyadh' },
  'Asia/Jeddah': { country: 'Saudi Arabia', countryCode: 'SA', city: 'Jeddah', region: 'Makkah' },
  'Asia/Dammam': { country: 'Saudi Arabia', countryCode: 'SA', city: 'Dammam', region: 'Eastern' },
  'Asia/Kuwait': { country: 'Kuwait', countryCode: 'KW', city: 'Kuwait City', region: 'Al Asimah' },
  'Asia/Doha': { country: 'Qatar', countryCode: 'QA', city: 'Doha', region: 'Doha' },
  'Asia/Bahrain': { country: 'Bahrain', countryCode: 'BH', city: 'Manama', region: 'Capital' },
  'Asia/Muscat': { country: 'Oman', countryCode: 'OM', city: 'Muscat', region: 'Muscat' },
  'Asia/Amman': { country: 'Jordan', countryCode: 'JO', city: 'Amman', region: 'Amman' },
  'Asia/Beirut': { country: 'Lebanon', countryCode: 'LB', city: 'Beirut', region: 'Beirut' },
  'Asia/Damascus': { country: 'Syria', countryCode: 'SY', city: 'Damascus', region: 'Damascus' },
  'Asia/Baghdad': { country: 'Iraq', countryCode: 'IQ', city: 'Baghdad', region: 'Baghdad' },
  'Asia/Tehran': { country: 'Iran', countryCode: 'IR', city: 'Tehran', region: 'Tehran' },
  'Asia/Jerusalem': { country: 'Israel', countryCode: 'IL', city: 'Jerusalem', region: 'Jerusalem' },
  
  // ==================== ASIA ====================
  'Asia/Tokyo': { country: 'Japan', countryCode: 'JP', city: 'Tokyo', region: 'Tokyo' },
  'Asia/Osaka': { country: 'Japan', countryCode: 'JP', city: 'Osaka', region: 'Osaka' },
  'Asia/Seoul': { country: 'South Korea', countryCode: 'KR', city: 'Seoul', region: 'Seoul' },
  'Asia/Busan': { country: 'South Korea', countryCode: 'KR', city: 'Busan', region: 'Busan' },
  'Asia/Shanghai': { country: 'China', countryCode: 'CN', city: 'Shanghai', region: 'Shanghai' },
  'Asia/Beijing': { country: 'China', countryCode: 'CN', city: 'Beijing', region: 'Beijing' },
  'Asia/Guangzhou': { country: 'China', countryCode: 'CN', city: 'Guangzhou', region: 'Guangdong' },
  'Asia/Shenzhen': { country: 'China', countryCode: 'CN', city: 'Shenzhen', region: 'Guangdong' },
  'Asia/Hong_Kong': { country: 'Hong Kong', countryCode: 'HK', city: 'Hong Kong', region: 'Hong Kong' },
  'Asia/Macau': { country: 'Macau', countryCode: 'MO', city: 'Macau', region: 'Macau' },
  'Asia/Taipei': { country: 'Taiwan', countryCode: 'TW', city: 'Taipei', region: 'Taipei' },
  'Asia/Singapore': { country: 'Singapore', countryCode: 'SG', city: 'Singapore', region: 'Singapore' },
  'Asia/Kuala_Lumpur': { country: 'Malaysia', countryCode: 'MY', city: 'Kuala Lumpur', region: 'Kuala Lumpur' },
  'Asia/Penang': { country: 'Malaysia', countryCode: 'MY', city: 'Penang', region: 'Penang' },
  'Asia/Jakarta': { country: 'Indonesia', countryCode: 'ID', city: 'Jakarta', region: 'Jakarta' },
  'Asia/Bali': { country: 'Indonesia', countryCode: 'ID', city: 'Denpasar', region: 'Bali' },
  'Asia/Bangkok': { country: 'Thailand', countryCode: 'TH', city: 'Bangkok', region: 'Bangkok' },
  'Asia/Phuket': { country: 'Thailand', countryCode: 'TH', city: 'Phuket', region: 'Phuket' },
  'Asia/Ho_Chi_Minh': { country: 'Vietnam', countryCode: 'VN', city: 'Ho Chi Minh City', region: 'Ho Chi Minh' },
  'Asia/Hanoi': { country: 'Vietnam', countryCode: 'VN', city: 'Hanoi', region: 'Hanoi' },
  'Asia/Manila': { country: 'Philippines', countryCode: 'PH', city: 'Manila', region: 'Manila' },
  'Asia/Cebu': { country: 'Philippines', countryCode: 'PH', city: 'Cebu', region: 'Cebu' },
  'Asia/Rangoon': { country: 'Myanmar', countryCode: 'MM', city: 'Yangon', region: 'Yangon' },
  'Asia/Phnom_Penh': { country: 'Cambodia', countryCode: 'KH', city: 'Phnom Penh', region: 'Phnom Penh' },
  'Asia/Vientiane': { country: 'Laos', countryCode: 'LA', city: 'Vientiane', region: 'Vientiane' },
  'Asia/Colombo': { country: 'Sri Lanka', countryCode: 'LK', city: 'Colombo', region: 'Western' },
  'Asia/Kathmandu': { country: 'Nepal', countryCode: 'NP', city: 'Kathmandu', region: 'Bagmati' },
  'Asia/Dhaka': { country: 'Bangladesh', countryCode: 'BD', city: 'Dhaka', region: 'Dhaka' },
  'Asia/Chittagong': { country: 'Bangladesh', countryCode: 'BD', city: 'Chittagong', region: 'Chittagong' },
  
  // ==================== EUROPE ====================
  'Europe/London': { country: 'United Kingdom', countryCode: 'GB', city: 'London', region: 'England' },
  'Europe/Manchester': { country: 'United Kingdom', countryCode: 'GB', city: 'Manchester', region: 'England' },
  'Europe/Birmingham': { country: 'United Kingdom', countryCode: 'GB', city: 'Birmingham', region: 'England' },
  'Europe/Edinburgh': { country: 'United Kingdom', countryCode: 'GB', city: 'Edinburgh', region: 'Scotland' },
  'Europe/Glasgow': { country: 'United Kingdom', countryCode: 'GB', city: 'Glasgow', region: 'Scotland' },
  'Europe/Paris': { country: 'France', countryCode: 'FR', city: 'Paris', region: 'Île-de-France' },
  'Europe/Lyon': { country: 'France', countryCode: 'FR', city: 'Lyon', region: 'Auvergne-Rhône-Alpes' },
  'Europe/Marseille': { country: 'France', countryCode: 'FR', city: 'Marseille', region: 'Provence-Alpes-Côte d\'Azur' },
  'Europe/Berlin': { country: 'Germany', countryCode: 'DE', city: 'Berlin', region: 'Berlin' },
  'Europe/Munich': { country: 'Germany', countryCode: 'DE', city: 'Munich', region: 'Bavaria' },
  'Europe/Frankfurt': { country: 'Germany', countryCode: 'DE', city: 'Frankfurt', region: 'Hesse' },
  'Europe/Hamburg': { country: 'Germany', countryCode: 'DE', city: 'Hamburg', region: 'Hamburg' },
  'Europe/Rome': { country: 'Italy', countryCode: 'IT', city: 'Rome', region: 'Lazio' },
  'Europe/Milan': { country: 'Italy', countryCode: 'IT', city: 'Milan', region: 'Lombardy' },
  'Europe/Naples': { country: 'Italy', countryCode: 'IT', city: 'Naples', region: 'Campania' },
  'Europe/Madrid': { country: 'Spain', countryCode: 'ES', city: 'Madrid', region: 'Madrid' },
  'Europe/Barcelona': { country: 'Spain', countryCode: 'ES', city: 'Barcelona', region: 'Catalonia' },
  'Europe/Valencia': { country: 'Spain', countryCode: 'ES', city: 'Valencia', region: 'Valencia' },
  'Europe/Lisbon': { country: 'Portugal', countryCode: 'PT', city: 'Lisbon', region: 'Lisbon' },
  'Europe/Porto': { country: 'Portugal', countryCode: 'PT', city: 'Porto', region: 'Porto' },
  'Europe/Amsterdam': { country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', region: 'North Holland' },
  'Europe/Rotterdam': { country: 'Netherlands', countryCode: 'NL', city: 'Rotterdam', region: 'South Holland' },
  'Europe/Brussels': { country: 'Belgium', countryCode: 'BE', city: 'Brussels', region: 'Brussels' },
  'Europe/Antwerp': { country: 'Belgium', countryCode: 'BE', city: 'Antwerp', region: 'Flanders' },
  'Europe/Vienna': { country: 'Austria', countryCode: 'AT', city: 'Vienna', region: 'Vienna' },
  'Europe/Salzburg': { country: 'Austria', countryCode: 'AT', city: 'Salzburg', region: 'Salzburg' },
  'Europe/Zurich': { country: 'Switzerland', countryCode: 'CH', city: 'Zurich', region: 'Zurich' },
  'Europe/Geneva': { country: 'Switzerland', countryCode: 'CH', city: 'Geneva', region: 'Geneva' },
  'Europe/Bern': { country: 'Switzerland', countryCode: 'CH', city: 'Bern', region: 'Bern' },
  'Europe/Stockholm': { country: 'Sweden', countryCode: 'SE', city: 'Stockholm', region: 'Stockholm' },
  'Europe/Gothenburg': { country: 'Sweden', countryCode: 'SE', city: 'Gothenburg', region: 'Västra Götaland' },
  'Europe/Oslo': { country: 'Norway', countryCode: 'NO', city: 'Oslo', region: 'Oslo' },
  'Europe/Bergen': { country: 'Norway', countryCode: 'NO', city: 'Bergen', region: 'Vestland' },
  'Europe/Copenhagen': { country: 'Denmark', countryCode: 'DK', city: 'Copenhagen', region: 'Capital' },
  'Europe/Helsinki': { country: 'Finland', countryCode: 'FI', city: 'Helsinki', region: 'Uusimaa' },
  'Europe/Warsaw': { country: 'Poland', countryCode: 'PL', city: 'Warsaw', region: 'Masovian' },
  'Europe/Krakow': { country: 'Poland', countryCode: 'PL', city: 'Krakow', region: 'Lesser Poland' },
  'Europe/Prague': { country: 'Czech Republic', countryCode: 'CZ', city: 'Prague', region: 'Prague' },
  'Europe/Budapest': { country: 'Hungary', countryCode: 'HU', city: 'Budapest', region: 'Central Hungary' },
  'Europe/Athens': { country: 'Greece', countryCode: 'GR', city: 'Athens', region: 'Attica' },
  'Europe/Thessaloniki': { country: 'Greece', countryCode: 'GR', city: 'Thessaloniki', region: 'Central Macedonia' },
  'Europe/Istanbul': { country: 'Turkey', countryCode: 'TR', city: 'Istanbul', region: 'Marmara' },
  'Europe/Ankara': { country: 'Turkey', countryCode: 'TR', city: 'Ankara', region: 'Central Anatolia' },
  'Europe/Moscow': { country: 'Russia', countryCode: 'RU', city: 'Moscow', region: 'Moscow' },
  'Europe/St_Petersburg': { country: 'Russia', countryCode: 'RU', city: 'St Petersburg', region: 'Leningrad' },
  'Europe/Dublin': { country: 'Ireland', countryCode: 'IE', city: 'Dublin', region: 'Leinster' },
  'Europe/Belfast': { country: 'United Kingdom', countryCode: 'GB', city: 'Belfast', region: 'Northern Ireland' },
  
  // ==================== NORTH AMERICA ====================
  'America/New_York': { country: 'USA', countryCode: 'US', city: 'New York', region: 'New York' },
  'America/Los_Angeles': { country: 'USA', countryCode: 'US', city: 'Los Angeles', region: 'California' },
  'America/Chicago': { country: 'USA', countryCode: 'US', city: 'Chicago', region: 'Illinois' },
  'America/Houston': { country: 'USA', countryCode: 'US', city: 'Houston', region: 'Texas' },
  'America/Phoenix': { country: 'USA', countryCode: 'US', city: 'Phoenix', region: 'Arizona' },
  'America/Philadelphia': { country: 'USA', countryCode: 'US', city: 'Philadelphia', region: 'Pennsylvania' },
  'America/San_Antonio': { country: 'USA', countryCode: 'US', city: 'San Antonio', region: 'Texas' },
  'America/San_Diego': { country: 'USA', countryCode: 'US', city: 'San Diego', region: 'California' },
  'America/Dallas': { country: 'USA', countryCode: 'US', city: 'Dallas', region: 'Texas' },
  'America/Austin': { country: 'USA', countryCode: 'US', city: 'Austin', region: 'Texas' },
  'America/Seattle': { country: 'USA', countryCode: 'US', city: 'Seattle', region: 'Washington' },
  'America/Denver': { country: 'USA', countryCode: 'US', city: 'Denver', region: 'Colorado' },
  'America/Boston': { country: 'USA', countryCode: 'US', city: 'Boston', region: 'Massachusetts' },
  'America/Detroit': { country: 'USA', countryCode: 'US', city: 'Detroit', region: 'Michigan' },
  'America/Atlanta': { country: 'USA', countryCode: 'US', city: 'Atlanta', region: 'Georgia' },
  'America/Miami': { country: 'USA', countryCode: 'US', city: 'Miami', region: 'Florida' },
  'America/Orlando': { country: 'USA', countryCode: 'US', city: 'Orlando', region: 'Florida' },
  'America/Las_Vegas': { country: 'USA', countryCode: 'US', city: 'Las Vegas', region: 'Nevada' },
  'America/Portland': { country: 'USA', countryCode: 'US', city: 'Portland', region: 'Oregon' },
  'America/Salt_Lake_City': { country: 'USA', countryCode: 'US', city: 'Salt Lake City', region: 'Utah' },
  'America/Toronto': { country: 'Canada', countryCode: 'CA', city: 'Toronto', region: 'Ontario' },
  'America/Vancouver': { country: 'Canada', countryCode: 'CA', city: 'Vancouver', region: 'British Columbia' },
  'America/Montreal': { country: 'Canada', countryCode: 'CA', city: 'Montreal', region: 'Quebec' },
  'America/Calgary': { country: 'Canada', countryCode: 'CA', city: 'Calgary', region: 'Alberta' },
  'America/Ottawa': { country: 'Canada', countryCode: 'CA', city: 'Ottawa', region: 'Ontario' },
  'America/Edmonton': { country: 'Canada', countryCode: 'CA', city: 'Edmonton', region: 'Alberta' },
  'America/Winnipeg': { country: 'Canada', countryCode: 'CA', city: 'Winnipeg', region: 'Manitoba' },
  'America/Mexico_City': { country: 'Mexico', countryCode: 'MX', city: 'Mexico City', region: 'CDMX' },
  'America/Guadalajara': { country: 'Mexico', countryCode: 'MX', city: 'Guadalajara', region: 'Jalisco' },
  'America/Monterrey': { country: 'Mexico', countryCode: 'MX', city: 'Monterrey', region: 'Nuevo León' },
  
  // ==================== SOUTH AMERICA ====================
  'America/Sao_Paulo': { country: 'Brazil', countryCode: 'BR', city: 'São Paulo', region: 'São Paulo' },
  'America/Rio_de_Janeiro': { country: 'Brazil', countryCode: 'BR', city: 'Rio de Janeiro', region: 'Rio de Janeiro' },
  'America/Brasilia': { country: 'Brazil', countryCode: 'BR', city: 'Brasília', region: 'Federal District' },
  'America/Buenos_Aires': { country: 'Argentina', countryCode: 'AR', city: 'Buenos Aires', region: 'Buenos Aires' },
  'America/Santiago': { country: 'Chile', countryCode: 'CL', city: 'Santiago', region: 'Santiago' },
  'America/Bogota': { country: 'Colombia', countryCode: 'CO', city: 'Bogotá', region: 'Bogotá' },
  'America/Medellin': { country: 'Colombia', countryCode: 'CO', city: 'Medellín', region: 'Antioquia' },
  'America/Lima': { country: 'Peru', countryCode: 'PE', city: 'Lima', region: 'Lima' },
  'America/Caracas': { country: 'Venezuela', countryCode: 'VE', city: 'Caracas', region: 'Capital' },
  'America/Quito': { country: 'Ecuador', countryCode: 'EC', city: 'Quito', region: 'Pichincha' },
  'America/La_Paz': { country: 'Bolivia', countryCode: 'BO', city: 'La Paz', region: 'La Paz' },
  'America/Montevideo': { country: 'Uruguay', countryCode: 'UY', city: 'Montevideo', region: 'Montevideo' },
  'America/Asuncion': { country: 'Paraguay', countryCode: 'PY', city: 'Asunción', region: 'Central' },
  'America/Panama': { country: 'Panama', countryCode: 'PA', city: 'Panama City', region: 'Panama' },
  'America/Costa_Rica': { country: 'Costa Rica', countryCode: 'CR', city: 'San José', region: 'San José' },
  'America/El_Salvador': { country: 'El Salvador', countryCode: 'SV', city: 'San Salvador', region: 'San Salvador' },
  'America/Guatemala': { country: 'Guatemala', countryCode: 'GT', city: 'Guatemala City', region: 'Guatemala' },
  
  // ==================== AFRICA ====================
  'Africa/Cairo': { country: 'Egypt', countryCode: 'EG', city: 'Cairo', region: 'Cairo' },
  'Africa/Alexandria': { country: 'Egypt', countryCode: 'EG', city: 'Alexandria', region: 'Alexandria' },
  'Africa/Johannesburg': { country: 'South Africa', countryCode: 'ZA', city: 'Johannesburg', region: 'Gauteng' },
  'Africa/Cape_Town': { country: 'South Africa', countryCode: 'ZA', city: 'Cape Town', region: 'Western Cape' },
  'Africa/Durban': { country: 'South Africa', countryCode: 'ZA', city: 'Durban', region: 'KwaZulu-Natal' },
  'Africa/Lagos': { country: 'Nigeria', countryCode: 'NG', city: 'Lagos', region: 'Lagos' },
  'Africa/Abuja': { country: 'Nigeria', countryCode: 'NG', city: 'Abuja', region: 'FCT' },
  'Africa/Nairobi': { country: 'Kenya', countryCode: 'KE', city: 'Nairobi', region: 'Nairobi' },
  'Africa/Mombasa': { country: 'Kenya', countryCode: 'KE', city: 'Mombasa', region: 'Mombasa' },
  'Africa/Dar_es_Salaam': { country: 'Tanzania', countryCode: 'TZ', city: 'Dar es Salaam', region: 'Dar es Salaam' },
  'Africa/Addis_Ababa': { country: 'Ethiopia', countryCode: 'ET', city: 'Addis Ababa', region: 'Addis Ababa' },
  'Africa/Casablanca': { country: 'Morocco', countryCode: 'MA', city: 'Casablanca', region: 'Casablanca-Settat' },
  'Africa/Rabat': { country: 'Morocco', countryCode: 'MA', city: 'Rabat', region: 'Rabat-Salé-Kénitra' },
  'Africa/Tunis': { country: 'Tunisia', countryCode: 'TN', city: 'Tunis', region: 'Tunis' },
  'Africa/Algiers': { country: 'Algeria', countryCode: 'DZ', city: 'Algiers', region: 'Algiers' },
  'Africa/Accra': { country: 'Ghana', countryCode: 'GH', city: 'Accra', region: 'Greater Accra' },
  'Africa/Kampala': { country: 'Uganda', countryCode: 'UG', city: 'Kampala', region: 'Central' },
  'Africa/Kigali': { country: 'Rwanda', countryCode: 'RW', city: 'Kigali', region: 'Kigali' },
  
  // ==================== AUSTRALIA & OCEANIA ====================
  'Australia/Sydney': { country: 'Australia', countryCode: 'AU', city: 'Sydney', region: 'New South Wales' },
  'Australia/Melbourne': { country: 'Australia', countryCode: 'AU', city: 'Melbourne', region: 'Victoria' },
  'Australia/Brisbane': { country: 'Australia', countryCode: 'AU', city: 'Brisbane', region: 'Queensland' },
  'Australia/Perth': { country: 'Australia', countryCode: 'AU', city: 'Perth', region: 'Western Australia' },
  'Australia/Adelaide': { country: 'Australia', countryCode: 'AU', city: 'Adelaide', region: 'South Australia' },
  'Australia/Canberra': { country: 'Australia', countryCode: 'AU', city: 'Canberra', region: 'ACT' },
  'Australia/Hobart': { country: 'Australia', countryCode: 'AU', city: 'Hobart', region: 'Tasmania' },
  'Australia/Darwin': { country: 'Australia', countryCode: 'AU', city: 'Darwin', region: 'Northern Territory' },
  'Pacific/Auckland': { country: 'New Zealand', countryCode: 'NZ', city: 'Auckland', region: 'Auckland' },
  'Pacific/Wellington': { country: 'New Zealand', countryCode: 'NZ', city: 'Wellington', region: 'Wellington' },
  'Pacific/Christchurch': { country: 'New Zealand', countryCode: 'NZ', city: 'Christchurch', region: 'Canterbury' },
  'Pacific/Fiji': { country: 'Fiji', countryCode: 'FJ', city: 'Suva', region: 'Central' },
  'Pacific/Guam': { country: 'Guam', countryCode: 'GU', city: 'Hagåtña', region: 'Guam' },
  'Pacific/Honolulu': { country: 'USA', countryCode: 'US', city: 'Honolulu', region: 'Hawaii' },
};

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
  
  const location = timezoneMap[timezone];
  
  if (location) {
    return {
      country: location.country,
      countryCode: location.countryCode,
      city: location.city,
      region: location.region,
      timezone,
      language
    };
  }
  
  // Fallback if timezone not in map
  return {
    country: 'Unknown',
    countryCode: 'UN',
    city: 'Unknown',
    region: 'Unknown',
    timezone,
    language
  };
}

export function guessCountryFromTimezone(timezone: string): string {
  return timezoneMap[timezone]?.country || 'Unknown';
}

export function getCountryCodeFromTimezone(timezone: string): string {
  return timezoneMap[timezone]?.countryCode || 'UN';
}

export function guessCityFromTimezone(timezone: string): string {
  return timezoneMap[timezone]?.city || 'Unknown';
}

export function guessRegionFromTimezone(timezone: string): string {
  return timezoneMap[timezone]?.region || 'Unknown';
}