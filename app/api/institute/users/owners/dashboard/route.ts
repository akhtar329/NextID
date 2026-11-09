// app/api/institute/users/owners/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { instituteUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// ============ TYPES ============
interface JwtPayload {
  id: number;
  email: string;
  name: string;
  role: string;
  accountType?: string;
}

// ============ HELPER: Verify Token ============
function verifyAuthToken(request: NextRequest): JwtPayload | null {
  try {
    const token = request.cookies.get('authToken')?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // ✅ Sirf institute users allow
    if (decoded.role !== 'institute') return null;

    return decoded;
  } catch {
    return null;
  }
}

// ============ GET /api/institute/users/owners/dashboard ============
export async function GET(request: NextRequest) {
  try {
    // ===== 1. AUTH CHECK =====
    const decodedUser = verifyAuthToken(request);

    if (!decodedUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Please sign in.',
        },
        { status: 401 }
      );
    }

    // ===== 2. FETCH OWNER FROM DB =====
    const owners = await db
      .select({
        id: instituteUsers.id,
        name: instituteUsers.name,
        email: instituteUsers.email,
        phone: instituteUsers.phone,
        status: instituteUsers.status,
        lastLogin: instituteUsers.lastLogin,
      })
      .from(instituteUsers)
      .where(eq(instituteUsers.id, decodedUser.id))
      .limit(1);

    if (owners.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'User account not found.',
        },
        { status: 404 }
      );
    }

    const owner = owners[0];

    // ===== 3. INSTITUTE DATA =====
    // ⚠️ Abhi ke liye null — jab institutes table banega tab query add karo
    // const institutes = await db.select().from(institutes).where(eq(institutes.ownerId, owner.id)).limit(1);
    // const institute = institutes.length > 0 ? institutes[0] : null;
    const institute = null;

    // ===== 4. STATS =====
    // ⚠️ Abhi placeholder — jab tables banenge tab queries add karo
    const stats = {
      totalStudents: 0,
      totalTeachers: 0,
      totalStaff: 0,
      totalClasses: 0,
      presentToday: 0,
      absentToday: 0,
      totalFees: 0,
      collectedFees: 0,
      pendingFees: 0,
      monthlyGrowth: 0,
    };

    // ===== 5. RESPONSE =====
    return NextResponse.json(
      {
        success: true,
        user: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
        },
        institute,
        stats,
        recentActivities: [],
        upcomingEvents: [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );

  } catch (err) {
    console.error('DASHBOARD ERROR:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load dashboard. Please try again.',
      },
      { status: 500 }
    );
  }
}