// app/sitemaps/admissions/route.ts

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { sql } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  
  try {
    const postsList = await db
      .select({
        slug: posts.slug,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(
        sql`${posts.type} = 'admission' AND ${posts.status} = 'published'`
      )
      .limit(1000);
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/admissions</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${postsList.map((post) => `
  <url>
    <loc>${BASE_URL}/admissions/${post.slug}</loc>
    <lastmod>${post.updatedAt ? new Date(post.updatedAt).toISOString().split("T")[0] : today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
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
    console.error("Error generating admissions sitemap:", error);
    
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/admissions</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
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