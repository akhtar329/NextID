import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { results } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  // Fetch only active results
  const data = await db
    .select({ slug: results.slug, resultDate: results.resultDate })
    .from(results)
    .where(eq(results.status, true));

  const urls = data.map(r => {
    const lastmod = r.resultDate
      ? r.resultDate.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    return `
      <url>
        <loc>${BASE_URL}/results/${r.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
    `;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex, follow"
    },
  });
}