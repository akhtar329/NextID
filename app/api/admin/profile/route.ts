// app/api/admin/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/db/db';
import { adminUsers, adminRoles } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Types
interface JWTPayload {
  id: number;
  email?: string;
  name?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: number | null;
  lastLogin: Date;
  joinDate: Date;
  permissions: string[];
}

// Helper function to get permissions based on role
function getPermissionsForRole(roleName: string): string[] {
  const permissionsMap: Record<string, string[]> = {
    'Super Admin': [
      'full_access',
      'user_management',
      'content_management',
      'analytics_view',
      'settings_manage',
      'role_management',
    ],
    'Admin': [
      'content_management',
      'analytics_view',
      'user_view',
    ],
    'Editor': [
      'content_management',
      'analytics_view',
    ],
    'Viewer': [
      'analytics_view',
    ],
  };

  return permissionsMap[roleName] || permissionsMap['Viewer'];
}

// Helper to get JWT secret
function getJWTSecret(): string {
  return process.env.JWT_SECRET || 'your-secret-key-change-this';
}

// ============================================
// GET - Fetch user profile
// ============================================
export async function GET(request: NextRequest) {
  try {
    // ✅ Get token from cookie (custom auth)
    const token = request.cookies.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // ✅ Verify JWT token - Fixed: removed 'any' type
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, getJWTSecret()) as JWTPayload;
    } catch {
      // Silent catch - jwtError not needed
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token payload' },
        { status: 401 }
      );
    }
    
    // ✅ Fetch user from database
    const user = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        roleId: adminUsers.roleId,
        status: adminUsers.status,
        createdAt: adminUsers.createdAt,
        lastLogin: adminUsers.lastLogin,
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

    const userData = user[0];

    // Check if user is active
    if (userData.status === false) {
      return NextResponse.json(
        { success: false, error: 'Account is disabled' },
        { status: 403 }
      );
    }

    // ✅ Fetch role name if roleId exists
    let roleName = 'Admin';
    if (userData.roleId) {
      const roles = await db
        .select({ name: adminRoles.name })
        .from(adminRoles)
        .where(eq(adminRoles.id, userData.roleId))
        .limit(1);
      
      if (roles.length > 0) {
        roleName = roles[0].name;
      }
    }

    // ✅ Define permissions based on role
    const permissions = getPermissionsForRole(roleName);

    // ✅ Update last login time (async - don't await)
    db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, userId))
      .catch(err => console.error('Failed to update last login:', err));

    const profile: ProfileResponse = {
      id: userData.id.toString(),
      name: userData.name,
      email: userData.email,
      role: roleName,
      roleId: userData.roleId,
      lastLogin: userData.lastLogin || new Date(),
      joinDate: userData.createdAt || new Date(),
      permissions: permissions,
    };

    return NextResponse.json({
      success: true,
      profile,
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Update user profile
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ Fixed: removed 'any' type
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, getJWTSecret()) as JWTPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists for another user
    const existingUser = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Update user profile
    await db
      .update(adminUsers)
      .set({ 
        name: name,
        email: email,
        updatedAt: new Date()
      })
      .where(eq(adminUsers.id, userId));

    // Fetch updated user
    const updatedUser = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        roleId: adminUsers.roleId,
        createdAt: adminUsers.createdAt,
        lastLogin: adminUsers.lastLogin,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get role name
    let roleName = 'Admin';
    if (updatedUser[0].roleId) {
      const roles = await db
        .select({ name: adminRoles.name })
        .from(adminRoles)
        .where(eq(adminRoles.id, updatedUser[0].roleId))
        .limit(1);
      
      if (roles.length > 0) {
        roleName = roles[0].name;
      }
    }

    // ✅ Update JWT token with new data
    const newToken = jwt.sign(
      { 
        id: updatedUser[0].id, 
        email: updatedUser[0].email, 
        name: updatedUser[0].name,
        role: roleName
      },
      getJWTSecret(),
      { expiresIn: '7d' }
    );

    const profile: ProfileResponse = {
      id: updatedUser[0].id.toString(),
      name: updatedUser[0].name,
      email: updatedUser[0].email,
      role: roleName,
      roleId: updatedUser[0].roleId,
      joinDate: updatedUser[0].createdAt || new Date(),
      lastLogin: updatedUser[0].lastLogin || new Date(),
      permissions: getPermissionsForRole(roleName),
    };

    const response = NextResponse.json({
      success: true,
      profile,
    });

    // Set new cookie with updated data
    response.cookies.set('authToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}