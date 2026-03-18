import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { news } from "@/app/lib/schema";
import { sql } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  const data = await db
    .select({ slug: news.slug, updatedAt: news.updatedAt })
    .from(news)
    .where(sql`${news.status} = true`);

  const urls = data.map((r: { slug: string; updatedAt: Date | null }) => {
    const lastmod = r.updatedAt
      ? r.updatedAt.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    return `
      <url>
        <loc>${BASE_URL}/news/${r.slug}</loc>
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
    },
  });
}