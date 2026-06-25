// app/api/admin/redirects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { 
  getRedirects, 
  saveRedirects, 
  addRedirect,
  deleteRedirect,
  updateRedirect,
  resetRedirects,
  syncRedirects,
  DEFAULT_REDIRECTS
} from "@/services/redirects/redirects-config";
import { type RedirectRule } from "@/services/redirects/redirects-config";

// ✅ GET: Fetch all redirects
export async function GET() {
  try {
    const redirects = getRedirects();
    return NextResponse.json({
      success: true,
      data: redirects,
      count: redirects.length,
      defaults: DEFAULT_REDIRECTS,
      defaultCount: DEFAULT_REDIRECTS.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, data: [], error: "Failed to fetch redirects" },
      { status: 500 }
    );
  }
}

// ✅ POST: Add/Update/Reset/Sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ✅ ACTION: Reset to defaults
    if (body.action === "reset") {
      resetRedirects();
      return NextResponse.json({
        success: true,
        message: `Redirects reset to ${DEFAULT_REDIRECTS.length} defaults`,
        data: getRedirects(),
      });
    }

    // ✅ ACTION: Sync with defaults
    if (body.action === "sync") {
      syncRedirects();
      return NextResponse.json({
        success: true,
        message: "Redirects synced with defaults",
        data: getRedirects(),
      });
    }

    // ✅ Add single redirect
    if (body.from && body.to) {
      addRedirect({
        from: body.from,
        to: body.to,
        status: body.status || 301,
      });
      
      return NextResponse.json({
        success: true,
        message: `Redirect added: ${body.from} → ${body.to}`,
        data: getRedirects(),
      });
    }

    // ✅ Add/Update multiple redirects (overwrite)
    if (Array.isArray(body)) {
      saveRedirects(body);
      return NextResponse.json({
        success: true,
        message: `${body.length} redirects saved`,
        count: body.length,
        data: body,
      });
    }

    // ✅ Add/Update with { redirects: [] }
    if (body.redirects && Array.isArray(body.redirects)) {
      saveRedirects(body.redirects);
      return NextResponse.json({
        success: true,
        message: `${body.redirects.length} redirects saved`,
        count: body.redirects.length,
        data: body.redirects,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid request format" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save redirects" },
      { status: 500 }
    );
  }
}

// ✅ PUT: Update existing redirect
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldFrom, redirect } = body;

    if (!oldFrom || !redirect) {
      return NextResponse.json(
        { success: false, error: '"oldFrom" and "redirect" are required' },
        { status: 400 }
      );
    }

    if (!redirect.from?.trim() || !redirect.to?.trim()) {
      return NextResponse.json(
        { success: false, error: '"from" and "to" are required' },
        { status: 400 }
      );
    }

    updateRedirect(oldFrom, redirect);

    return NextResponse.json({
      success: true,
      message: `Redirect updated: ${oldFrom} → ${redirect.from}`,
      data: getRedirects(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Remove redirect
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");

    if (!from) {
      return NextResponse.json(
        { success: false, error: '"from" parameter required' },
        { status: 400 }
      );
    }

    deleteRedirect(from);

    return NextResponse.json({
      success: true,
      message: `Redirect "${from}" deleted`,
      data: getRedirects(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 500 }
    );
  }
}