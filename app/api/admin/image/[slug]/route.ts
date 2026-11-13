
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (
      typeof slug !== "string" ||
      slug.length === 0 ||
      slug.length > 255
    ) {
      return new NextResponse("Invalid image name", { status: 400 });
    }

    const imageName = slug.replace(/\.(?:jpg|jpeg|png|webp)$/i, "");

    if (!/^[a-zA-Z0-9_-]+$/.test(imageName)) {
      return new NextResponse("Invalid image name", { status: 400 });
    }

    const { env } = getCloudflareContext();

    // Ensure the static assets binding exists.
    if (!env.ASSETS) {
      console.error("Cloudflare ASSETS binding is not configured.");

      return new NextResponse("Image storage is unavailable", {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      });
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const searchPaths = [
      `/uploads/news/${year}/${month}/${imageName}.webp`,
      `/uploads/admissions/${year}/${month}/${imageName}.webp`,
      `/uploads/${imageName}.webp`,
      `/uploads/${imageName}.jpg`,
    ];

    for (const assetPath of searchPaths) {
      const assetUrl = new URL(assetPath, request.url);

      const assetResponse = await env.ASSETS.fetch(
        new Request(assetUrl.toString(), {
          method: "GET",
        })
      );

      if (assetResponse.status === 404) {
        continue;
      }

      if (!assetResponse.ok) {
        return new NextResponse("Unable to load image", {
          status: 502,
        });
      }

      const headers = new Headers(assetResponse.headers);

      headers.set("Cache-Control", CACHE_CONTROL);
      headers.set("X-Content-Type-Options", "nosniff");

      return new NextResponse(assetResponse.body, {
        status: 200,
        headers,
      });
    }

    return new NextResponse("Image not found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Admin image route error:", error);

    return new NextResponse("Internal server error", {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
