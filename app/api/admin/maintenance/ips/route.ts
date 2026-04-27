// app/api/admin/maintenance/ips/route.ts
import { NextRequest, NextResponse } from 'next/server';

let allowedIps: string[] = process.env.MAINTENANCE_ALLOW_IPS?.split(',') || [];

export async function POST(request: NextRequest) {
  try {
    const { ip } = await request.json();
    if (ip && !allowedIps.includes(ip)) {
      allowedIps.push(ip);
    }
    return NextResponse.json({
      success: true,
      message: 'IP added successfully',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to add IP' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ip } = await request.json();
    allowedIps = allowedIps.filter(i => i !== ip);
    return NextResponse.json({
      success: true,
      message: 'IP removed successfully',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to remove IP' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    ips: allowedIps,
  });
}
