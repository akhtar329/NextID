// app/(public)/robots.txt/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /login/
Disallow: /api/
Disallow: /_next/

Sitemap: https://nextid.pk/sitemap.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}