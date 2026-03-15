import { NextResponse } from "next/server"

const BASE_URL = "https://www.nextid.pk"

export async function GET() {

  const sitemaps = [
    "pages",
    "admissions",
    "universities",
    "boards",
    "cities",
    "programs",
    "results",
    "news"
  ]

  const urls = sitemaps.map((name) => `
    <sitemap>
      <loc>${BASE_URL}/sitemaps/${name}.xml</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
  `)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join("")}
  </sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml"
    }
  })
}