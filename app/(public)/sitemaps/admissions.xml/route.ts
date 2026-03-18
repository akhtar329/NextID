// app/sitemaps/admissions.xml/route.ts

import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"
import { admissions } from "@/app/lib/schema"

const BASE_URL = "https://www.nextid.pk"

export async function GET() {

  const data = await db
    .select({
      slug: admissions.slug,
      lastmod: admissions.updatedAt
    })
    .from(admissions)

  const urls = data.map((a) => `
    <url>
      <loc>${BASE_URL}/admissions/${a.slug}</loc>
      <lastmod>${a.lastmod ? new Date(a.lastmod).toISOString() : new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `).join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    }
  })
}