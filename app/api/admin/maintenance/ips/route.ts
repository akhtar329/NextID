
// app/api/admin/maintenance/ips/route.ts

import { NextResponse } from "next/server";

const MAX_IPS = 500;

function getInitialAllowedIps(): string[] {
  const configuredIps = process.env.MAINTENANCE_ALLOW_IPS ?? "";

  return Array.from(
    new Set(
      configuredIps
        .split(",")
        .map((ip) => ip.trim())
        .filter((ip) => isValidIp(ip))
    )
  ).slice(0, MAX_IPS);
}

let allowedIps: string[] = getInitialAllowedIps();

function isValidIpv4(ip: string): boolean {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return false;
    }

    const value = Number(part);

    return value >= 0 && value <= 255;
  });
}

function isValidIpv6(ip: string): boolean {
  if (!ip.includes(":") || ip.includes("%")) {
    return false;
  }

  // Support IPv4-mapped IPv6 addresses.
  const normalized = ip.toLowerCase();

  if (normalized.includes(".")) {
    const lastColon = normalized.lastIndexOf(":");

    if (lastColon === -1) {
      return false;
    }

    const ipv4Part = normalized.slice(lastColon + 1);

    if (!isValidIpv4(ipv4Part)) {
      return false;
    }

    return isValidIpv6(
      `${normalized.slice(0, lastColon)}:ffff:${ipv4Part
        .split(".")
        .map((part) => Number(part).toString(16))
        .join(":")}`
    );
  }

  if (!/^[0-9a-f:]+$/.test(normalized)) {
    return false;
  }

  if (normalized.includes(":::")) {
    return false;
  }

  const doubleColonCount = (normalized.match(/::/g) ?? []).length;

  if (doubleColonCount > 1) {
    return false;
  }

  const hasCompression = normalized.includes("::");
  const parts = normalized.split(":");

  if (parts.some((part) => part.length > 4)) {
    return false;
  }

  const nonEmptyParts = parts.filter(Boolean);

  if (nonEmptyParts.length > 8) {
    return false;
  }

  if (hasCompression) {
    return nonEmptyParts.length < 8;
  }

  return nonEmptyParts.length === 8;
}

function isValidIp(ip: string): boolean {
  if (!ip || ip.length > 45 || ip.trim() !== ip) {
    return false;
  }

  return isValidIpv4(ip) || isValidIpv6(ip);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function readIpFromRequest(
  request: Request
): Promise<{ ip: string } | null> {
  try {
    const body: unknown = await request.json();

    if (!isRecord(body) || typeof body.ip !== "string") {
      return null;
    }

    const ip = body.ip.trim();

    if (!isValidIp(ip)) {
      return null;
    }

    return { ip };
  } catch {
    return null;
  }
}

// GET: Fetch allowed maintenance IPs
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      ips: allowedIps,
    });
  } catch (error) {
    console.error("GET maintenance IPs error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch allowed IPs",
      },
      { status: 500 }
    );
  }
}

// POST: Add an allowed IP
export async function POST(request: Request) {
  try {
    const data = await readIpFromRequest(request);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid IPv4 or IPv6 address is required",
        },
        { status: 400 }
      );
    }

    if (allowedIps.includes(data.ip)) {
      return NextResponse.json({
        success: true,
        message: "IP is already in the allowlist",
        ips: allowedIps,
      });
    }

    if (allowedIps.length >= MAX_IPS) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum allowed IP limit reached",
        },
        { status: 400 }
      );
    }

    allowedIps = [...allowedIps, data.ip];

    return NextResponse.json({
      success: true,
      message: "IP added successfully",
      ips: allowedIps,
    });
  } catch (error) {
    console.error("POST maintenance IP error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add IP",
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove an allowed IP
export async function DELETE(request: Request) {
  try {
    const data = await readIpFromRequest(request);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid IPv4 or IPv6 address is required",
        },
        { status: 400 }
      );
    }

    if (!allowedIps.includes(data.ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "IP address not found in allowlist",
        },
        { status: 404 }
      );
    }

    allowedIps = allowedIps.filter((ip) => ip !== data.ip);

    return NextResponse.json({
      success: true,
      message: "IP removed successfully",
      ips: allowedIps,
    });
  } catch (error) {
    console.error("DELETE maintenance IP error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove IP",
      },
      { status: 500 }
    );
  }
}
