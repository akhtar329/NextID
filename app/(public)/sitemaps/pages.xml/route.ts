import { NextResponse } from "next/server";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  const pages = [
    "",
    "contact",
    "privacy",
    "terms",
    "faqs",
    "search",
    "admissions",
    "universities",
    "boards",
    "cities",
    "programs",
    "results",
    "news"
  ];

  const today = new Date().toISOString().split("T")[0];

  const urls = pages.map(page => `
    <url>
      <loc>${BASE_URL}/${page}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>${page === "" ? "1.0" : "0.7"}</priority>
    </url>
  `).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex, follow"
    }
  });
}