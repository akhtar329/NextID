// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { adminUsers, adminRoles } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  getThrottleDelay,
  RATE_LIMIT_CONFIG,
} from '@/lib/rate-limit';

// ============ HELPERS ============
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');

  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  if (cfIP) return cfIP;
  return 'unknown';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============ POST /api/auth/login ============
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // ===== 1. VALIDATION =====
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const clientIP = getClientIP(request);

    // ===== 2. IP RATE LIMIT =====
    const ipKey = `login:ip:${clientIP}`;
    const ipCheck = checkRateLimit(ipKey, RATE_LIMIT_CONFIG.IP);

    if (!ipCheck.allowed) {
      const minutesLeft = Math.ceil((ipCheck.retryAfterSeconds || 0) / 60);
      return NextResponse.json(
        {
          error: `Too many login attempts from your network. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
          retryAfter: ipCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': ipCheck.retryAfterSeconds.toString() },
        }
      );
    }

    // ===== 3. ACCOUNT RATE LIMIT =====
    const accountKey = `login:account:${cleanEmail}`;
    const accountCheck = checkRateLimit(accountKey, RATE_LIMIT_CONFIG.ACCOUNT);

    if (!accountCheck.allowed) {
      const minutesLeft = Math.ceil((accountCheck.retryAfterSeconds || 0) / 60);
      return NextResponse.json(
        {
          error: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
          retryAfter: accountCheck.retryAfterSeconds,
          lockedUntil: accountCheck.lockedUntil,
        },
        {
          status: 429,
          headers: { 'Retry-After': accountCheck.retryAfterSeconds.toString() },
        }
      );
    }

    // ===== 4. THROTTLE DELAY (slow down brute-force) =====
    const delay = getThrottleDelay(accountCheck.attemptCount);
    if (delay > 0) await sleep(delay);

    // ===== 5. FIND USER =====
    const users = await db
      .select()
      .from(adminUsers)
      .where(sql`LOWER(${adminUsers.email}) = ${cleanEmail}`)
      .limit(1);

    // ⚠️ Same generic error for "user not found" AND "wrong password"
    //    (info leak prevent — attacker ko na pata chale email exist karti hai ya nahi)
    if (users.length === 0) {
      const accountResult = recordFailedAttempt(accountKey, RATE_LIMIT_CONFIG.ACCOUNT);
      recordFailedAttempt(ipKey, RATE_LIMIT_CONFIG.IP);

      return NextResponse.json(
        {
          error: 'Invalid credentials',
          remaining: accountResult.remaining,
          retryAfter: accountResult.retryAfterSeconds,
        },
        {
          status: accountResult.allowed ? 401 : 429,
          headers: { 'X-RateLimit-Remaining': accountResult.remaining.toString() },
        }
      );
    }

    const user = users[0];

    // ===== 6. CHECK STATUS =====
    if (!user.status) {
      // Disabled account — log attempt but don't reveal reason
      recordFailedAttempt(accountKey, RATE_LIMIT_CONFIG.ACCOUNT);
      recordFailedAttempt(ipKey, RATE_LIMIT_CONFIG.IP);

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // ===== 7. VERIFY PASSWORD =====
    const isValid = await compare(password, user.password);

    if (!isValid) {
      const accountResult = recordFailedAttempt(accountKey, RATE_LIMIT_CONFIG.ACCOUNT);
      const ipResult = recordFailedAttempt(ipKey, RATE_LIMIT_CONFIG.IP);

      // Warning jab 2 ya kam attempts bachein
      let errorMessage = 'Invalid credentials';
      if (!accountResult.allowed) {
        const minutesLeft = Math.ceil((accountResult.retryAfterSeconds || 0) / 60);
        errorMessage = `Too many failed attempts. Account locked for ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`;
      } else if (accountResult.remaining <= 2 && accountResult.remaining > 0) {
        errorMessage = `Invalid credentials. ${accountResult.remaining} attempt${accountResult.remaining !== 1 ? 's' : ''} remaining before lockout.`;
      }

      // IP lockout check
      if (!ipResult.allowed) {
        const minutesLeft = Math.ceil((ipResult.retryAfterSeconds || 0) / 60);
        errorMessage = `Too many attempts from your network. Blocked for ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          remaining: accountResult.remaining,
          retryAfter: accountResult.retryAfterSeconds,
        },
        {
          status: !accountResult.allowed || !ipResult.allowed ? 429 : 401,
          headers: { 'X-RateLimit-Remaining': accountResult.remaining.toString() },
        }
      );
    }

    // ===== 8. SUCCESS → RESET ACCOUNT COUNTER =====
    resetRateLimit(accountKey);
    // Note: IP counter reset NAHI karte (attacker account switch karta hai)

    // ===== 9. GET ROLE =====
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

    // ===== 10. JWT =====
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
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
        role: roleName,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ===== 11. UPDATE LAST LOGIN (fire & forget) =====
    db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, user.id))
      .catch(() => {});

    // ===== 12. RESPONSE + COOKIE =====
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        role: roleName,
      },
    });

    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    return response;

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}