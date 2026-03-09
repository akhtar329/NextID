import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { admissions } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📦 Request body:', body);
    
    // Validation
    if (!body.name || !body.slug || !body.programId || !body.instituteId || !body.year || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'Name, slug, programId, instituteId, year, and status are required' },
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

    // Create admission
    const newAdmission = await db
      .insert(admissions)
      .values({
        name: body.name,
        slug: body.slug,
        programId: Number(body.programId),
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

    console.log('✅ Admission created:', newAdmission[0]);

    return NextResponse.json({
      success: true,
      admission: newAdmission[0],
      message: 'Admission created successfully'
    });

  } catch (error: any) {
    console.error('❌ Error creating admission:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { 
          error: 'Duplicate slug', 
          details: 'An admission with this slug already exists. Please use a different slug.' 
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