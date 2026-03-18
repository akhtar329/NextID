// app/sitemaps/admissions.xml/route.ts

import { NextResponse } from "next/server"
import { db } from "@/app/lib/db"
import { admissions } from "@/app/lib/schema"
import { eq } from "drizzle-orm"

const BASE_URL = "https://www.nextid.pk"

export async function GET() {

  // ✅ DB se sirf active admissions uthao
  const data = await db
    .select({
      slug: admissions.slug,
      lastmod: admissions.updatedAt
    })
    .from(admissions)
    .where(eq(admissions.status, "active"))

  // ❗ Empty case handle (important for Google)
  if (!data.length) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { "Content-Type": "application/xml" }
    })
  }

  // ✅ URLs generate karo
  const urls = data.map((a) => `
    <url>
      <loc>${BASE_URL}/admissions/${a.slug}</loc>
      <lastmod>${a.lastmod ? new Date(a.lastmod).toISOString() : new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `).join("")

  // ✅ Final XML
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