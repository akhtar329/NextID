import { NextResponse } from "next/server"

const BASE_URL = "https://www.nextid.pk"

export async function GET() {

  const today = new Date().toISOString().split("T")[0]

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
      <lastmod>${today}</lastmod>
    </sitemap>
  `)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex, follow"
    }
  })
}