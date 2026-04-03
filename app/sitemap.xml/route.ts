// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const sitemaps = [
    { name: "pages",        priority: "1" },
    { name: "admissions",   priority: "0.9" },
    { name: "universities", priority: "0.9" },
    { name: "programs",     priority: "0.8" },
    { name: "results",      priority: "0.8" },
    { name: "news",         priority: "0.8" },
    { name: "boards",       priority: "0.7" },
    { name: "cities",       priority: "0.7" },
  ];

  const urls = sitemaps.map(
    ({ name }) => `
  <sitemap>
    <loc>${BASE_URL}/sitemaps/${name}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      // ✅ Cache: 6 ghante fresh, phir 24 ghante stale serve
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
      // ✅ X-Robots-Tag REMOVED — sitemap ko noindex nahi karna
    },
  });
}