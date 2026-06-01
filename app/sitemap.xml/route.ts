// app/sitemap.xml/route.ts

import { NextResponse } from "next/server";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  
  const sitemaps = [
    { name: "pages" },
    { name: "admissions" },
    { name: "results" },
    { name: "news" },
    { name: "date-sheets" },
    { name: "scholarships" },
    { name: "jobs" },
  ];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(({ name }) => `  <sitemap>
    <loc>${BASE_URL}/sitemaps/${name}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>`;
  
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}