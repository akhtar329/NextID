export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "./app/lib/db";
import { redirects } from "./app/lib/schema";
import { eq } from "drizzle-orm";
import { getCachedRedirect, setCachedRedirect } from "@/app/lib/cache";

export async function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;
  const ua = request.headers.get("user-agent") || "";

  // ==================== BOT PROTECTION ====================

  const badBots = [
    "AhrefsBot",
    "SemrushBot",
    "MJ12bot",
    "DotBot",
    "Bytespider",
    "PetalBot",
    "BLEXBot",
    "YandexBot",
  ];

  if (badBots.some((bot) => ua.includes(bot))) {
    return new NextResponse("Blocked", { status: 403 });
  }

  const isSearchBot = ua.includes("Googlebot") || ua.includes("bingbot");

  // ==================== REDIRECT CHECK ====================

  const skipPaths = [
    "/api/admin",
    "/admin",
    "/_next",
    "/favicon.ico",
    "/login",
  ];

  const shouldSkipRedirect = skipPaths.some((path) =>
    pathname.startsWith(path),
  );

  if (!shouldSkipRedirect && !pathname.includes(".")) {
    try {
      const baseUrl = `${request.nextUrl.protocol}//${host}`;

      const possiblePaths = [
        pathname,
        `${baseUrl}${pathname}`,
        `https://nextid.pk${pathname}`,
        pathname.replace(/^\//, ""),
      ];

      let redirectRule = null;

      // cache check
      for (const checkPath of possiblePaths) {
        redirectRule = getCachedRedirect(checkPath);
        if (redirectRule !== undefined) break;
      }

      // DB fallback
      if (redirectRule === undefined) {
        for (const checkPath of possiblePaths) {
          redirectRule = await db
            .select()
            .from(redirects)
            .where(eq(redirects.fromPath, checkPath))
            .then((res) => res[0]);

          if (redirectRule) {
            setCachedRedirect(checkPath, redirectRule);
            break;
          }
        }

        if (!redirectRule) {
          setCachedRedirect(pathname, null);
        }
      }

      if (redirectRule && redirectRule.status) {
        // lightweight hit counter (non-blocking)
        db.update(redirects)
          .set({
            hitCount: (redirectRule.hitCount || 0) + 1,
            lastHit: new Date(),
          })
          .where(eq(redirects.id, redirectRule.id))
          .catch(() => {});

        let destination = redirectRule.toPath;

        if (destination.startsWith("http")) {
          try {
            const destUrl = new URL(destination);
            destination = destUrl.pathname;
          } catch {}
        }

        return NextResponse.redirect(new URL(destination, request.url), {
          status: redirectRule.statusCode as 301 | 302,
        });
      }
    } catch (error) {
      console.error("Redirect middleware error:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/colleges/:path*",
    "/admissions/:path*",
    "/universities/:path*",
    "/programs/:path*",
    "/results/:path*",
    "/boards/:path*",
    "/news/:path*",
    "/cities/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/login",
  ],
};
