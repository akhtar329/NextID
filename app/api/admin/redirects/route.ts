import { db } from '@/app/lib/db';
import { redirects } from '@/app/lib/schema';
import { NextRequest, NextResponse } from 'next/server';

// GET all redirects
export async function GET() {
  try {
    const allRedirects = await db.select().from(redirects);
    
    // ✅ Always return an array
    return NextResponse.json(allRedirects || []);
  } catch (error) {
    console.error('Error fetching redirects:', error);
    // ✅ Return empty array on error, not an error object
    return NextResponse.json([], { status: 200 });
  }
}

// POST create redirect
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromPath, toPath, statusCode } = body;

    if (!fromPath || !toPath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [newRedirect] = await db.insert(redirects).values({
      fromPath,
      toPath,
      statusCode: statusCode || 301,
      status: true,
      hitCount: 0,
    }).returning();

    return NextResponse.json(newRedirect);
  } catch (error) {
    console.error('Error creating redirect:', error);
    return NextResponse.json(
      { error: 'Redirect already exists or invalid data' },
      { status: 500 }
    );
  }
}