// app/sitemaps/boards.xml/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { boards } from "@/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  try {
    const data = await db
      .select({ slug: boards.slug, createdAt: boards.createdAt })
      .from(boards)
      .where(eq(boards.status, true)); // ✅ Sirf active boards

    const urls = data
      .map((b) => {
        const lastmod = b.createdAt?.toISOString() ?? new Date().toISOString();
        return `
  <url>
    <loc>${BASE_URL}/boards/${b.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800", // ✅ 24 ghante
        // ✅ X-Robots-Tag REMOVED
      },
    });
  } catch (error) {
    console.error("❌ Boards sitemap error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
