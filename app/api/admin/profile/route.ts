// app/api/admin/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/app/lib/db';
import { adminUsers } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    
    const user = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        roleId: adminUsers.roleId,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Mock permissions for now (or fetch from your permissions table)
    const permissions = ['full_access', 'user_management', 'content_management'];

    return NextResponse.json({
      success: true,
      profile: {
        id: user[0].id.toString(),
        name: user[0].name,
        email: user[0].email,
        role: 'Super Admin', // You can fetch role from adminRoles table
        lastLogin: new Date(),
        joinDate: user[0].createdAt || new Date(),
        permissions: permissions,
      },
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}