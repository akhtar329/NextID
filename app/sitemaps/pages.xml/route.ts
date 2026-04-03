// app/sitemaps/pages.xml/route.ts
import { NextResponse } from "next/server";

const BASE_URL = "https://www.nextid.pk";

export async function GET() {
  try {
    const today = new Date().toISOString();

    // ✅ Priority aur changefreq har page ke liye alag
    const pages = [
      { path: "",             priority: "1.0", changefreq: "daily"   },
      { path: "admissions",   priority: "0.9", changefreq: "daily"   },
      { path: "universities", priority: "0.9", changefreq: "weekly"  },
      { path: "programs",     priority: "0.8", changefreq: "weekly"  },
      { path: "results",      priority: "0.8", changefreq: "daily"   },
      { path: "news",         priority: "0.8", changefreq: "daily"   },
      { path: "boards",       priority: "0.7", changefreq: "monthly" },
      { path: "cities",       priority: "0.6", changefreq: "monthly" },
      { path: "contact",      priority: "0.5", changefreq: "yearly"  },
      { path: "faqs",         priority: "0.5", changefreq: "monthly" },
      { path: "privacy",      priority: "0.3", changefreq: "yearly"  },
      { path: "terms",        priority: "0.3", changefreq: "yearly"  },
      // ✅ search page removed — noindex hai
    ];

    const urls = pages
      .map(
        ({ path, priority, changefreq }) => `
  <url>
    <loc>${BASE_URL}/${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
      )
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        // ✅ X-Robots-Tag REMOVED
      },
    });
  } catch (error) {
    console.error("❌ Pages sitemap error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}