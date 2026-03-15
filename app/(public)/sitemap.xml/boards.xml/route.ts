import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"
import { boards } from "@/app/lib/schema"

const BASE_URL = "https://www.nextid.pk"

export async function GET() {
  const data = await db.select({ slug: boards.slug, updatedAt: boards.createdAt })
    .from(boards)

  const urls = data.map(b => `
    <url>
      <loc>${BASE_URL}/boards/${b.slug}</loc>
      <lastmod>${b.updatedAt?.toISOString() ?? new Date().toISOString()}</lastmod>
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