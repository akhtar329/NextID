// app/sitemaps/news/route.ts

import { NextResponse } from "next/server";
import { getSitemapPosts } from "@/lib/sitemap-cache";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  
  try {
    const postsList = await getSitemapPosts("news");
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/news</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${postsList.map((post) => `
  <url>
    <loc>${BASE_URL}/news/${post.slug}</loc>
    <lastmod>${post.updatedAt ? new Date(post.updatedAt).toISOString().split("T")[0] : today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
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
    console.error("Error generating news sitemap:", error);
    
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/news</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
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
