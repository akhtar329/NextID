import { NextRequest, NextResponse } from "next/server";
import { getAllRedirectRules } from "@/services/redirects/redirects-config";

interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

interface SaveRedirectsBody {
  redirects: RedirectRule[];
}

let currentRedirects: RedirectRule[] = getAllRedirectRules().map((rule) => ({
  from:
    rule.from instanceof RegExp
      ? rule.from.toString()
      : String(rule.from),
  to: rule.to,
  status: rule.status,
}));

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: currentRedirects,
    });
  } catch (error) {
    console.error("GET redirects error:", error);

    return NextResponse.json({
      success: false,
      data: [],
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveRedirectsBody;
    const { redirects } = body;

    if (!Array.isArray(redirects)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid redirects array",
        },
        { status: 400 }
      );
    }

    for (const rule of redirects) {
      if (!rule.from || typeof rule.from !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing or invalid "from" field',
          },
          { status: 400 }
        );
      }

      if (!rule.to || typeof rule.to !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing or invalid "to" field',
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
      .map((r) => r.from)
      .filter((item, index, arr) => arr.indexOf(item) !== index);

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
      message: `${redirects.length} redirects updated`,
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