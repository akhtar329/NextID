import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"
import { admissions } from "@/app/lib/schema"

const BASE_URL = "https://www.nextid.pk"

export async function GET() {
  const data = await db.select({ slug: admissions.slug, updatedAt: admissions.updatedAt })
    .from(admissions)

  const urls = data.map(a => `
    <url>
      <loc>${BASE_URL}/admissions/${a.slug}</loc>
      <lastmod>${a.updatedAt?.toISOString() ?? new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </urlset>`

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } })
}