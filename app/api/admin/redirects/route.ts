import { NextRequest, NextResponse } from "next/server";
import {
  redirects as initialRedirects,
  type RedirectRule,
} from "@/services/redirects/redirects-config";

interface SaveRedirectsBody {
  redirects: RedirectRule[];
}

let currentRedirects: RedirectRule[] = [...initialRedirects];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: currentRedirects,
    });
  } catch (error) {
    console.error("GET redirects error:", error);

    return NextResponse.json(
      {
        success: false,
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveRedirectsBody;

    if (!Array.isArray(body.redirects)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid redirects array",
        },
        { status: 400 }
      );
    }

    const redirects = body.redirects;

    for (const rule of redirects) {
      if (!rule.from?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: '"from" field is required',
          },
          { status: 400 }
        );
      }

      if (!rule.to?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: '"to" field is required',
          },
          { status: 400 }
        );
      }

      if (rule.status !== 301 && rule.status !== 302) {
        return NextResponse.json(
          {
            success: false,
            error: "Status must be 301 or 302",
          },
          { status: 400 }
        );
      }
    }

    const duplicatePaths = redirects
      .map((r) => r.from.trim())
      .filter(
        (path, index, array) => array.indexOf(path) !== index
      );

    if (duplicatePaths.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Duplicate paths found: ${duplicatePaths.join(", ")}`,
        },
        { status: 400 }
      );
    }

    currentRedirects = redirects;

    return NextResponse.json({
      success: true,
      message: `${redirects.length} redirects updated successfully`,
      count: redirects.length,
    });
  } catch (error) {
    console.error("POST redirects error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update redirects",
      },
      { status: 500 }
    );
  }
}