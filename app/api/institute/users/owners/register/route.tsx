// app/api/institute/users/owners/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { instituteUsers } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
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

// ============ EMAIL VALIDATION ============
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============ POST /api/institute/users/owners/register ============
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    // ===== 1. VALIDATION =====
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, email and password are required',
          message: 'Name, email and password are required',
        },
        { status: 400 }
      );
    }

    // Name validation
    const cleanName = String(name).trim();
    if (cleanName.length < 2 || cleanName.length > 150) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name must be between 2 and 150 characters',
          message: 'Name must be between 2 and 150 characters',
        },
        { status: 400 }
      );
    }

    // Email validation
    const cleanEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
          message: 'Invalid email address',
        },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be between 8 and 128 characters',
          message: 'Password must be between 8 and 128 characters',
        },
        { status: 400 }
      );
    }

    // Phone validation (optional)
    const cleanPhone = phone ? String(phone).trim() : null;
    if (cleanPhone && cleanPhone.length > 30) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone number is too long',
          message: 'Phone number is too long',
        },
        { status: 400 }
      );
    }

    const clientIP = getClientIP(request);

    // ===== 2. IP RATE LIMIT (register abuse prevent) =====
    const ipKey = `institute:register:ip:${clientIP}`;
    const ipCheck = checkRateLimit(ipKey, {
      maxAttempts: 5,           // 5 registrations per 15 min
      windowMs: 15 * 60 * 1000,
      lockoutMs: 60 * 60 * 1000, // 1 hour block
    });

    if (!ipCheck.allowed) {
      const minutesLeft = Math.ceil((ipCheck.retryAfterSeconds || 0) / 60);
      return NextResponse.json(
        {
          success: false,
          error: `Too many registration attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
          message: `Too many registration attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
          retryAfter: ipCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': ipCheck.retryAfterSeconds.toString() },
        }
      );
    }

    // ===== 3. CHECK IF EMAIL ALREADY EXISTS =====
    const existingUsers = await db
      .select({ id: instituteUsers.id })
      .from(instituteUsers)
      .where(sql`LOWER(${instituteUsers.email}) = ${cleanEmail}`)
      .limit(1);

    if (existingUsers.length > 0) {
      // Record attempt (prevent email enumeration spam)
      recordFailedAttempt(ipKey, {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        lockoutMs: 60 * 60 * 1000,
        exponential: false,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'This email is already registered. Please sign in instead.',
          message: 'This email is already registered. Please sign in instead.',
        },
        { status: 409 }  // 409 Conflict
      );
    }

    // ===== 4. HASH PASSWORD =====
    const hashedPassword = await hash(password, 10);

    // ===== 5. INSERT USER =====
    const [newUser] = await db
      .insert(instituteUsers)
      .values({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
        status: true,               // Active by default
        // emailVerifiedAt: null,   // Verify later (optional)
      })
      .returning({
        id: instituteUsers.id,
        name: instituteUsers.name,
        email: instituteUsers.email,
        createdAt: instituteUsers.createdAt,
      });

    // ===== 6. RESET IP COUNTER ON SUCCESS =====
    resetRateLimit(ipKey);

    // ===== 7. RESPONSE =====
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! You can now sign in.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      },
      {
        status: 201,  // 201 Created
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );

  } catch (err) {
    console.error('INSTITUTE REGISTER ERROR:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed. Please try again.',
        message: 'Registration failed. Please try again.',
      },
      { status: 500 }
    );
  }
}