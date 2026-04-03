// app/sitemaps/universities.xml/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { institutes } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  try {
    const data = await db
      .select({ slug: institutes.slug, createdAt: institutes.createdAt })
      .from(institutes)
      .where(eq(institutes.status, true)); // ✅ Sirf active institutes

    const urls = data
      .map(
        (u) => `
  <url>
    <loc>${BASE_URL}/universities/${u.slug}</loc>
    <lastmod>${u.createdAt?.toISOString() ?? new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
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
        "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400", // ✅ 12 ghante
        // ✅ X-Robots-Tag REMOVED
      },
    });
  } catch (error) {
    console.error("❌ Universities sitemap error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}