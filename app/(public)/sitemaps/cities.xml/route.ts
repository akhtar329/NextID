import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"
import { cities } from "@/app/lib/schema"

const BASE_URL = "https://www.nextid.pk"

export async function GET() {
  const data = await db
    .select({ slug: cities.slug, createdAt: cities.createdAt })
    .from(cities)

  const urls = data.map(c => {
    const lastmod = c.createdAt?.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0]
    return `
      <url>
        <loc>${BASE_URL}/cities/${c.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
    `
  }).join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex, follow"
    }
  })
}