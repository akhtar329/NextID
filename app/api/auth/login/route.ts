// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { adminUsers, adminRoles } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const users = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase()))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users[0];

    if (user.status === false) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 401 }
      );
    }

    const isValid = await compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    let roleName = 'admin';
    if (user.roleId) {
      const roles = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.id, user.roleId))
        .limit(1);
      
      if (roles.length > 0) {
        roleName = roles[0].name;
      }
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      // Silent fail - don't expose error details
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        roleId: user.roleId,
        role: roleName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Don't await - fire and forget for faster response
    db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, user.id))
      .catch(() => {});

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        role: roleName,
      }
    });

    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.headers.set('Cache-Control', 'no-store, must-revalidate');

    return response;

  } catch {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}