// app/api/admin/program-institutes/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { programInstitutes } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

// GET single program-institute relation
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
      .from(programInstitutes)
      .where(eq(programInstitutes.id, relationId))
      .limit(1);

    if (!relation.length) {
      return NextResponse.json(
        { error: 'Program-Institute relation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(relation[0]);
  } catch (error) {
    console.error('Error fetching program-institute relation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program-institute relation' },
      { status: 500 }
    );
  }
}

// PUT update program-institute relation
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
    const { programId, instituteId, status } = body;

    // Validate required fields
    if (!programId || !instituteId) {
      return NextResponse.json(
        { error: 'Program ID and Institute ID are required' },
        { status: 400 }
      );
    }

    const updatedRelation = await db
      .update(programInstitutes)
      .set({
        programId: parseInt(programId),
        instituteId: parseInt(instituteId),
        status: status !== undefined ? status : true,
      })
      .where(eq(programInstitutes.id, relationId))
      .returning();

    if (!updatedRelation.length) {
      return NextResponse.json(
        { error: 'Program-Institute relation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRelation[0]);
  } catch (error) {
    console.error('Error updating program-institute relation:', error);
    return NextResponse.json(
      { error: 'Failed to update program-institute relation' },
      { status: 500 }
    );
  }
}

// DELETE program-institute relation
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
      .delete(programInstitutes)
      .where(eq(programInstitutes.id, relationId));

    return NextResponse.json(
      { success: true, message: 'Program-Institute relation deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting program-institute relation:', error);
    return NextResponse.json(
      { error: 'Failed to delete program-institute relation' },
      { status: 500 }
    );
  }
}