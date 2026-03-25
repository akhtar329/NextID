// app/api/admin/admissions/route.ts (POST method)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { admissions, admissionPrograms } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.name || !body.slug || !body.programIds || !body.instituteId || !body.year || !body.status) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          details: 'Name, slug, programIds (array), instituteId, year, and status are required' 
        },
        { status: 400 }
      );
    }

    // ✅ Ensure programIds is an array
    const programIds = Array.isArray(body.programIds) ? body.programIds : [body.programIds];
    
    if (programIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one program is required' },
        { status: 400 }
      );
    }

    // ✅ Check if slug already exists
    const existingAdmission = await db
      .select()
      .from(admissions)
      .where(eq(admissions.slug, body.slug))
      .limit(1);

    if (existingAdmission.length > 0) {
      return NextResponse.json(
        { error: 'Slug already exists', details: 'Please use a different slug' },
        { status: 400 }
      );
    }

    // ✅ Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // 1. Create admission (without programId)
      const [newAdmission] = await tx
        .insert(admissions)
        .values({
          name: body.name,
          slug: body.slug,
          instituteId: Number(body.instituteId),
          year: Number(body.year),
          session: body.session || null,
          status: body.status,
          expectedOpenDate: body.expectedOpenDate ? new Date(body.expectedOpenDate) : null,
          expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
          meritInfo: body.meritInfo || null,
          note: body.note || null,
          officialLink: body.officialLink || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 2. Insert into junction table for each program
      const junctionRecords = await Promise.all(
        programIds.map(async (programId: number) => {
          const [record] = await tx
            .insert(admissionPrograms)
            .values({
              admissionId: newAdmission.id,
              programId: Number(programId),
              createdAt: new Date(),
            })
            .returning();
          return record;
        })
      );

      return { newAdmission, junctionRecords };
    });

    return NextResponse.json({
      success: true,
      admission: result.newAdmission,
      programCount: result.junctionRecords.length,
      message: `Admission created successfully with ${result.junctionRecords.length} program(s)`
    });

  } catch (error: any) {
    console.error('❌ Error creating admission:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      // Check which unique constraint failed
      if (error.message?.includes('admissions_slug_unique')) {
        return NextResponse.json(
          { 
            error: 'Duplicate slug', 
            details: 'An admission with this slug already exists. Please use a different slug.' 
          },
          { status: 400 }
        );
      }
      if (error.message?.includes('admission_programs_admission_id_program_id_unique')) {
        return NextResponse.json(
          { 
            error: 'Duplicate program', 
            details: 'This program is already linked to this admission.' 
          },
          { status: 400 }
        );
      }
    }

    // Handle foreign key violation
    if (error.code === '23503') {
      return NextResponse.json(
        { 
          error: 'Invalid reference', 
          details: 'One or more program IDs or institute ID do not exist.' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create admission', details: error.message },
      { status: 500 }
    );
  }
}