import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"
import { news } from "@/app/lib/schema"

const BASE_URL = "https://www.nextid.pk"

export async function GET() {
  const data = await db.select({ slug: news.slug, updatedAt: news.updatedAt })
    .from(news)

  const urls = data.map(n => `
    <url>
      <loc>${BASE_URL}/news/${n.slug}</loc>
      <lastmod>${n.updatedAt?.toISOString() ?? new Date().toISOString()}</lastmod>
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