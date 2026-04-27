// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";

const BASE_URL = "https://www.nextid.pk";

interface SitemapConfig {
  name: string;
  priority: string;
  dynamic: boolean;
}

const SITEMAPS: SitemapConfig[] = [
  { name: "pages", priority: "1.0", dynamic: false },
  { name: "admissions", priority: "0.9", dynamic: false },
  { name: "universities", priority: "0.9", dynamic: true },
  { name: "results", priority: "0.8", dynamic: true },
  { name: "news", priority: "0.8", dynamic: true },
  { name: "boards", priority: "0.7", dynamic: true },
  {  name: "cities", priority: "0.7", dynamic: true },
  {  name: "programs", priority: "0.8", dynamic: true },
];

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const urls = SITEMAPS.map(({ name, priority }) => {
      const lastmod = today;
      
      return `
  <sitemap>
    <loc>${BASE_URL}/sitemaps/${name}.xml</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
  </sitemap>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</sitemapindex>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
    
  } catch {
    const fallbackDate = new Date().toISOString().split("T")[0];
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemaps/pages.xml</loc>
    <lastmod>${fallbackDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemaps/universities.xml</loc>
    <lastmod>${fallbackDate}</lastmod>
  </sitemap>
</sitemapindex>`;
    
    return new NextResponse(fallbackXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=43200",
      },
    });
  }
}

