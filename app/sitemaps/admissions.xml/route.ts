// app/sitemaps/admissions.xml/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { admissions } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  try {
    const data = await db
      .select({
        slug: admissions.slug,
        updatedAt: admissions.updatedAt,
        status: admissions.status,
      })
      .from(admissions)
      .where(eq(admissions.status, "Open")); // ✅ Sirf Open admissions index hon

    const urls = data
      .map(
        (a) => `
  <url>
    <loc>${BASE_URL}/admissions/${a.slug}</loc>
    <lastmod>${a.updatedAt ? new Date(a.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
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
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400", // ✅ 6 ghante
        // ✅ X-Robots-Tag REMOVED — sitemap index honi chahiye
      },
    });
  } catch (error) {
    console.error("❌ Admissions sitemap error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
