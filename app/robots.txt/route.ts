// app/robots.txt/route.ts
import { NextResponse } from 'next/server';

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

// AI Bots to block (training scrapers)
const AI_BOTS = [
  'GPTBot',
  'ChatGPT-User', 
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'meta-webindexer',
  'FacebookBot',
  'Applebot-Extended',
  'CCBot',
  'PerplexityBot',
  'YouBot',
  'cohere-ai',
  'cohere-training-crawler',
  'Diffbot',
  'ImagesiftBot',
  'PanguBot',
  'Bytespider',
  'Timpibot',
  'ZoominfoBot',
  'SemrushBot',
  'AhrefsBot',
  'MJ12bot',
  'Dotbot',
  'DataForSeoBot'
] as const;

// Base domain - configurable for different environments
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'https://www.nextid.pk';
};

// Generate robots.txt content - pure function
const generateRobotsTxt = (baseUrl: string): string => {
  const sitemapEntries = SITEMAPS.map(sitemap => `Sitemap: ${baseUrl}${sitemap}`).join('\n');
  
  // Generate AI bot block rules
  const aiBotRules = AI_BOTS.map(bot => `User-agent: ${bot}\nDisallow: /`).join('\n\n');
  
  return `# robots.txt for NextID Educational Platform
# Generated: ${new Date().toISOString().split('T')[0]}
# Last Updated: Blocked AI training bots to save compute resources

# ============================================
# AI TRAINING BOTS - BLOCKED (Save Compute)
# ============================================
${aiBotRules}

# ============================================
# DEFAULT RULE (All other crawlers)
# ============================================
User-agent: *
Allow: /

# Allow legitimate search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: YandexBot
Allow: /

User-agent: twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: Slackbot
Allow: /

User-agent: Discordbot
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
Crawl-delay: 2

# ============================================
# SITEMAPS
# ============================================
${sitemapEntries}
`;
};

export async function GET() {
  try {
    const baseUrl = getBaseUrl();
    const robotsTxt = generateRobotsTxt(baseUrl);
    
    // Simple headers - NO CACHE
    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        // No cache - always fresh
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('Failed to generate robots.txt:', error);
    
    // Fallback robots.txt
    const fallbackRobotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Sitemap: ${getBaseUrl()}/sitemap.xml`;
    
    return new NextResponse(fallbackRobotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}