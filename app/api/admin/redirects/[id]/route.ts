import { db } from '@/app/lib/db';
import { redirects } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET single redirect by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('🔍 Fetching redirect ID:', id);
    
    const redirectId = parseInt(id);
    
    if (isNaN(redirectId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    const result = await db
      .select()
      .from(redirects)
      .where(eq(redirects.id, redirectId));
    
    console.log('📊 Result:', result);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT update redirect
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const redirectId = parseInt(id);
    const body = await request.json();
    
    const [updated] = await db.update(redirects)
      .set({ 
        toPath: body.toPath,
        statusCode: body.statusCode,
      })
      .where(eq(redirects.id, redirectId))
      .returning();
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// PATCH update status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const redirectId = parseInt(id);
    const body = await request.json();
    
    const [updated] = await db.update(redirects)
      .set({ status: body.status })
      .where(eq(redirects.id, redirectId))
      .returning();
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Status update failed' }, { status: 500 });
  }
}

// DELETE redirect
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const redirectId = parseInt(id);
    await db.delete(redirects).where(eq(redirects.id, redirectId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}