// app/api/admin/program-institutes/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { programOfferings } from '@/app/lib/schema';  // ✅ Changed
import { eq } from 'drizzle-orm';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

// GET single program-offering relation
export async function GET(
  request: NextRequest, 
  props: Props
) {
  try {
    const { id } = await props.params;
    const relationId = parseInt(id);
    
    if (isNaN(relationId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const relation = await db
      .select()
      .from(programOfferings)  // ✅ Changed
      .where(eq(programOfferings.id, relationId))
      .limit(1);

    if (!relation.length) {
      return NextResponse.json(
        { error: 'Program-Offering relation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(relation[0]);
  } catch (error) {
    console.error('Error fetching program-offering relation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program-offering relation' },
      { status: 500 }
    );
  }
}

// PUT update program-offering relation
export async function PUT(
  request: NextRequest, 
  props: Props
) {
  try {
    const { id } = await props.params;
    const relationId = parseInt(id);
    
    if (isNaN(relationId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { programId, instituteId, degreeId, status } = body;

    // Validate required fields
    if (!programId || !instituteId || !degreeId) {  // ✅ Added degreeId validation
      return NextResponse.json(
        { error: 'Program ID, Institute ID, and Degree ID are required' },
        { status: 400 }
      );
    }

    const updatedRelation = await db
      .update(programOfferings)  // ✅ Changed
      .set({
        programId: parseInt(programId),
        instituteId: parseInt(instituteId),
        degreeId: parseInt(degreeId),  // ✅ Added degreeId
        status: status !== undefined ? status : true,
      })
      .where(eq(programOfferings.id, relationId))
      .returning();

    if (!updatedRelation.length) {
      return NextResponse.json(
        { error: 'Program-Offering relation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRelation[0]);
  } catch (error) {
    console.error('Error updating program-offering relation:', error);
    return NextResponse.json(
      { error: 'Failed to update program-offering relation' },
      { status: 500 }
    );
  }
}

// DELETE program-offering relation
export async function DELETE(
  request: NextRequest, 
  props: Props
) {
  try {
    const { id } = await props.params;
    const relationId = parseInt(id);
    
    if (isNaN(relationId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    await db
      .delete(programOfferings)  // ✅ Changed
      .where(eq(programOfferings.id, relationId));

    return NextResponse.json(
      { success: true, message: 'Program-Offering relation deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting program-offering relation:', error);
    return NextResponse.json(
      { error: 'Failed to delete program-offering relation' },
      { status: 500 }
    );
  }
}