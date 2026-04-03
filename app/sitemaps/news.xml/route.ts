// app/sitemaps/news.xml/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { news } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  try {
    const data = await db
      .select({ slug: news.slug, updatedAt: news.updatedAt })
      .from(news)
      .where(eq(news.status, true)); // ✅ sql`` hata ke eq() lagaya

    const urls = data
      .map(
        (r) => `
  <url>
    <loc>${BASE_URL}/news/${r.slug}</loc>
    <lastmod>${r.updatedAt?.toISOString() ?? new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
      )
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        // ✅ X-Robots-Tag REMOVED
      },
    });
  } catch (error) {
    console.error("❌ News sitemap error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}