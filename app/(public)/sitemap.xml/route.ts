import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { institutes } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  const data = await db
    .select({ slug: institutes.slug, updatedAt: institutes.createdAt })
    .from(institutes)
    .where(eq(institutes.type, "University"));

  if (!data.length) {
    // agar database me universities nahi hain
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }

  const urls = data.map(u => `
    <url>
      <loc>${BASE_URL}/universities/${u.slug}</loc>
      <lastmod>${u.updatedAt?.toISOString() ?? new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" }
  });
}