// app/sitemaps/programs.xml/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programs } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  try {
    const data = await db
      .select({ slug: programs.slug, updatedAt: programs.updatedAt })
      .from(programs)
      .where(eq(programs.status, true)); // ✅ Sirf active programs

    const urls = data
      .map(
        (p) => `
  <url>
    <loc>${BASE_URL}/programs/${p.slug}</loc>
    <lastmod>${p.updatedAt?.toISOString() ?? new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
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
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        // ✅ X-Robots-Tag REMOVED
      },
    });
  } catch (error) {
    console.error("❌ Programs sitemap error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
