// app/robots.txt/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Cache duration: 7 days (in seconds) for robots.txt
const CACHE_DURATION = 604800; // 7 days (vs 1 day before)
const STALE_WHILE_REVALIDATE = 86400; // 1 day stale-while-revalidate

// Extract sitemap URLs to constant for reusability
const SITEMAPS = [
  '/sitemap.xml',
  '/sitemaps/admissions.xml',
  '/sitemaps/universities.xml',
  '/sitemaps/programs.xml',
  '/sitemaps/news.xml',
  '/sitemaps/results.xml',
  '/sitemaps/boards.xml',
  '/sitemaps/cities.xml',
  '/sitemaps/pages.xml'
] as const;

// Base domain - configurable for different environments
const getBaseUrl = () => {
  // Use environment variable for production
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  // Fallback for development
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'https://www.nextid.pk';
};

// Generate robots.txt content - pure function for better caching
const generateRobotsTxt = (baseUrl: string): string => {
  const sitemapEntries = SITEMAPS.map(sitemap => `Sitemap: ${baseUrl}${sitemap}`).join('\n');
  
  return `# robots.txt for NextID Educational Platform
# Generated: ${new Date().toISOString().split('T')[0]}
# Cache: 7 days (updated weekly)

User-agent: *
Allow: /

# ============================================
# PRIVATE & AUTHENTICATION ROUTES
# ============================================
Disallow: /admin/
Disallow: /login/
Disallow: /register/
Disallow: /unauthorized/
Disallow: /forgot-password/
Disallow: /reset-password/
Disallow: /verify-email/
Disallow: /error/

# ============================================
# API ROUTES (internal use only)
# ============================================
Disallow: /api/
Disallow: /api/auth/
Disallow: /api/admin/

# ============================================
# STATIC ASSETS (optimize crawl budget)
# ============================================
Disallow: /_next/static/media/
Disallow: /_next/static/chunks/
Disallow: /_next/image/
Disallow: /_next/data/

# ============================================
# USER-GENERATED & SEARCH PAGES (low SEO value)
# ============================================
Disallow: /search?
Disallow: /filter?
Disallow: /compare?
Disallow: /dashboard/

# ============================================
# DUPLICATE OR THIN CONTENT
# ============================================
Disallow: /*?page=
Disallow: /*?sort=
Disallow: /*?filter=

# ============================================
# SLOW CRAWL PATHS
# ============================================
Crawl-delay: 1

# ============================================
# SITEMAPS (enables full indexation)
# ============================================
${sitemapEntries}

# ============================================
# PERFORMANCE NOTES
# ============================================
# - 95%+ cache hit rate expected
# - Served from CDN edge
# - Zero database queries
# - Zero function executions after first request
`;
};

export async function GET() {
  try {
    // Get base URL based on environment
    const baseUrl = getBaseUrl();
    const robotsTxt = generateRobotsTxt(baseUrl);
    
    // Get request headers for cache validation
    const headersList = await headers();
    const ifModifiedSince = headersList.get('if-modified-since');
    
    // Return 304 Not Modified if content hasn't changed (robots.txt rarely changes)
    // This further reduces bandwidth and execution time
    if (ifModifiedSince) {
      const lastModified = new Date(ifModifiedSince);
      const today = new Date();
      const isToday = lastModified.toDateString() === today.toDateString();
      
      if (isToday) {
        return new NextResponse(null, { status: 304 });
      }
    }
    
    // Optimized cache headers for CDN-first delivery
    const cacheHeaders = {
      'Content-Type': 'text/plain; charset=utf-8',
      // CDN/Browser cache: 7 days
      'Cache-Control': `public, s-maxage=${CACHE_DURATION}, max-age=${CACHE_DURATION}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
      // Vercel CDN cache
      'CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
      // CloudFlare compatible
      'Cloudflare-CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}`,
      // Last modified for 304 responses
      'Last-Modified': new Date().toUTCString(),
      // Vary only on host (not user-agent for better cache hits)
      'Vary': 'Accept-Encoding, Host',
      // Cache tags for purging if needed
      'Cache-Tag': 'robots-txt, static-config',
    };
    
    return new NextResponse(robotsTxt, {
      status: 200,
      headers: cacheHeaders,
    });
    
  } catch (error) {
    // Production-safe error fallback
    console.error('Failed to generate robots.txt:', error);
    
    // Minimal valid robots.txt for error case (still cachable)
    const fallbackRobotsTxt = `User-agent: *
Allow: /
Sitemap: ${getBaseUrl()}/sitemap.xml`;
    
    return new NextResponse(fallbackRobotsTxt, {
      status: 200, // Return 200 even on error to avoid crawling issues
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, max-age=3600', // 1 hour fallback cache
      },
    });
  }
}

// Optional: Add ISR configuration at page level if using static generation
export const dynamic = 'force-static'; // Force static generation if possible
export const revalidate = CACHE_DURATION; // ISR revalidation every 7 days