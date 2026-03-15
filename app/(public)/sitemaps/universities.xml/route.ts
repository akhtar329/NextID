// app/(public)/sitemap.xml/universities.xml/route.ts
import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"
import { institutes } from "@/app/lib/schema"

const BASE_URL = "https://www.nextid.pk"

export async function GET() {
  // Select all institutes (slug is already NOT NULL in schema)
  const data = await db
    .select({
      slug: institutes.slug,
      lastmod: institutes.createdAt,
    })
    .from(institutes)

  const urls = data.map(u => `
    <url>
      <loc>${BASE_URL}/universities/${u.slug}</loc>
      <lastmod>${u.lastmod ? u.lastmod.toISOString() : new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join("")}
  </urlset>`

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" }
  })
}