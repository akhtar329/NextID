// app/sitemaps/date-sheets/route.ts

import { NextResponse } from "next/server";
import { getSitemapPosts } from "@/lib/sitemap-cache";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  
  try {
    const postsList = await getSitemapPosts("date_sheet");
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/date-sheets</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
${postsList.map((post) => `
  <url>
    <loc>${BASE_URL}/date-sheets/${post.slug}</loc>
    <lastmod>${post.updatedAt ? new Date(post.updatedAt).toISOString().split("T")[0] : today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join("")}
</urlset>`;
    
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
    
  } catch (error) {
    console.error("Error generating date-sheets sitemap:", error);
    
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/date-sheets</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
    
    return new NextResponse(fallbackXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=43200",
      },
    });
  }
}
