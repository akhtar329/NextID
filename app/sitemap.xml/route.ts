// app/sitemap.xml/route.ts

import { NextResponse } from "next/server";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  
  const sitemaps = [
    { name: "pages", priority: "1.0" },
    { name: "admissions", priority: "0.9" },
    { name: "results", priority: "0.8" },
    { name: "news", priority: "0.8" },
    { name: "date-sheets", priority: "0.7" },
    { name: "scholarships", priority: "0.7" },
    { name: "jobs", priority: "0.7" },
  ];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(({ name, priority }) => `
  <sitemap>
    <loc>${BASE_URL}/sitemaps/${name}.xml</loc>
    <lastmod>${today}</lastmod>
    <priority>${priority}</priority>
  </sitemap>`).join("")}
</sitemapindex>`;
  
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}