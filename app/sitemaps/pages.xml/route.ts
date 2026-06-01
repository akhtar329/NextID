// app/sitemaps/pages/route.ts

import { NextResponse } from "next/server";

const BASE_URL = "https://www.nextid.pk";

const STATIC_PAGES = [
  { url: "", priority: "1.0", changefreq: "daily" },           // Home
  { url: "admissions", priority: "0.9", changefreq: "daily" },
  { url: "results", priority: "0.8", changefreq: "daily" },
  { url: "news", priority: "0.8", changefreq: "daily" },
  { url: "date-sheets", priority: "0.7", changefreq: "weekly" },
  { url: "scholarships", priority: "0.7", changefreq: "weekly" },
  { url: "jobs", priority: "0.7", changefreq: "weekly" },
  { url: "contact", priority: "0.5", changefreq: "monthly" },
  { url: "about", priority: "0.5", changefreq: "monthly" },
  { url: "privacy", priority: "0.4", changefreq: "monthly" },
  { url: "terms", priority: "0.4", changefreq: "monthly" },
];

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map((page) => `
  <url>
    <loc>${BASE_URL}/${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("")}
</urlset>`;
  
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}