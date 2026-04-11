import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { programOfferings, programs, institutes } from '@/app/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instituteId = searchParams.get('instituteId');
    const programId = searchParams.get('programId');

    // Build conditions safely
    const conditions = [];

    if (instituteId) {
      conditions.push(
        eq(programOfferings.instituteId, parseInt(instituteId))
      );
    }

    if (programId) {
      conditions.push(
        eq(programOfferings.programId, parseInt(programId))
      );
    }

    const offerings = await db
      .select({
        id: programOfferings.id,
        programId: programOfferings.programId,
        instituteId: programOfferings.instituteId,
        status: programOfferings.status,
        createdAt: programOfferings.createdAt,
        updatedAt: programOfferings.updatedAt,

        programName: programs.name,
        programSlug: programs.slug,

        instituteName: institutes.name,
      })
      .from(programOfferings)
      .leftJoin(
        programs,
        eq(programOfferings.programId, programs.id)
      )
      .leftJoin(
        institutes,
        eq(programOfferings.instituteId, institutes.id)
      )
      .where(conditions.length ? and(...conditions) : undefined);

    const transformedOfferings = offerings.map((offering) => ({
      id: offering.id,
      programId: offering.programId,
      programName: offering.programName,
      degreeName: offering.programName,
      instituteId: offering.instituteId,
      instituteName: offering.instituteName,
      status: offering.status,
      createdAt: offering.createdAt,
      updatedAt: offering.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      offerings: transformedOfferings,
      count: transformedOfferings.length,
    });
  } catch (error) {
    console.error('❌ Error fetching program offerings:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch program offerings',
        details:
          error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.programId || !body.instituteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'programId and instituteId are required',
        },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(programOfferings)
      .where(
        and(
          eq(programOfferings.programId, body.programId),
          eq(programOfferings.instituteId, body.instituteId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program offering already exists for this institute',
        },
        { status: 400 }
      );
    }

    const insertData: any = {
      programId: body.programId,
      instituteId: body.instituteId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (body.status !== undefined) {
      insertData.status = body.status;
    }

    const [newOffering] = await db
      .insert(programOfferings)
      .values(insertData)
      .returning();

    return NextResponse.json({
      success: true,
      offering: newOffering,
      message: 'Program offering created successfully',
    });
  } catch (error) {
    console.error('❌ Error creating program offering:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create program offering',
        details:
          error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}