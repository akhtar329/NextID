// app/robots.txt/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Admin & Auth pages block
Disallow: /admin/
Disallow: /login/
Disallow: /unauthorized/
Disallow: /forgot-password/
Disallow: /error/

# API block
Disallow: /api/

# Next.js internals block
Disallow: /_next/static/media/
Disallow: /_next/image/

# Empty/form-only pages block
Disallow: /search/

# Sitemaps - All listed for Google
Sitemap: https://www.nextid.pk/sitemap.xml
Sitemap: https://www.nextid.pk/sitemaps/admissions.xml
Sitemap: https://www.nextid.pk/sitemaps/universities.xml
Sitemap: https://www.nextid.pk/sitemaps/programs.xml
Sitemap: https://www.nextid.pk/sitemaps/news.xml
Sitemap: https://www.nextid.pk/sitemaps/results.xml
Sitemap: https://www.nextid.pk/sitemaps/boards.xml
Sitemap: https://www.nextid.pk/sitemaps/cities.xml
Sitemap: https://www.nextid.pk/sitemaps/pages.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // 24 hours cache
    },
  });
}