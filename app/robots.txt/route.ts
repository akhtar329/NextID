// app/robots.txt/route.ts
import { NextResponse } from 'next/server';

// ==================== SITEMAP URLs ====================
const SITEMAPS = [
  '/sitemap.xml',
] as const;

// ==================== AI BOTS TO BLOCK ====================
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
  'DataForSeoBot',
  'Google-Extended',
  'Amazonbot',
  'FacebookExternalHit',
] as const;

// ==================== BLOCKED PATHS ====================
const BLOCKED_PATHS = [
  '/admin/',
  '/login/',
  '/register/',
  '/forgot-password/',
  '/reset-password/',
  '/verify-email/',
  '/unauthorized/',
  '/error/',
  '/api/',
  '/api/auth/',
  '/api/admin/',
  '/_next/static/media/',
  '/_next/static/chunks/',
  '/_next/image/',
  '/_next/data/',
];

// ==================== GENERATE robots.txt ====================
const generateRobotsTxt = (baseUrl: string): string => {
  const sitemapEntries = SITEMAPS.map(sitemap => `Sitemap: ${baseUrl}${sitemap}`).join('\n');
  
  const aiBotRules = AI_BOTS.map(bot => `User-agent: ${bot}\nDisallow: /`).join('\n\n');
  
  const blockedPathRules = BLOCKED_PATHS.map(path => `Disallow: ${path}`).join('\n');
  
  return `# robots.txt for NextID.pk
# Generated: ${new Date().toISOString().split('T')[0]}

# ============================================
# AI TRAINING BOTS - FULLY BLOCKED
# ============================================
${aiBotRules}

# ============================================
# LEGITIMATE SEARCH ENGINES - ALLOWED
# ============================================
User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: Bingbot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: DuckDuckBot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: Baiduspider
Allow: /
Disallow: /admin/

User-agent: YandexBot
Allow: /
Disallow: /admin/

User-agent: twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: Slackbot
Allow: /

User-agent: Discordbot
Allow: /

# ============================================
# DEFAULT RULE
# ============================================
User-agent: *
Allow: /
Crawl-delay: 1

# ============================================
# BLOCKED PATHS
# ============================================
${blockedPathRules}

# ============================================
# SITEMAPS
# ============================================
${sitemapEntries}
`;
};

// ==================== GET BASE URL ====================
const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'https://www.nextid.pk';
};

// ==================== MAIN HANDLER - NO CACHE ====================
export async function GET() {
  try {
    const baseUrl = getBaseUrl();
    const robotsTxt = generateRobotsTxt(baseUrl);
    
    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        // ❌ NO CACHE HEADERS - removed
      },
    });
    
  } catch (error) {
    console.error('Failed to generate robots.txt:', error);
    
    const fallbackRobotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: ${getBaseUrl()}/sitemap.xml`;
    
    return new NextResponse(fallbackRobotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}