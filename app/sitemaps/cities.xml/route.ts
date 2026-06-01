// app/sitemaps/cities.xml/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { cities } from "@/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  try {
    const data = await db
      .select({ slug: cities.slug, createdAt: cities.createdAt })
      .from(cities)
      .where(eq(cities.status, true)); // ✅ Sirf active cities

    const urls = data
      .map(
        (c) => `
  <url>
    <loc>${BASE_URL}/cities/${c.slug}</loc>
    <lastmod>${c.createdAt?.toISOString() ?? new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
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
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        // ✅ X-Robots-Tag REMOVED
      },
    });
  } catch (error) {
    console.error("❌ Cities sitemap error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
