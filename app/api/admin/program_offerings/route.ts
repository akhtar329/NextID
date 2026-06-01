// app/api/admin/program-offerings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { programOfferings, programs, institutes, degrees, levels, categories } from '@/db/schema';
import { eq, and, like, or } from 'drizzle-orm';

// ============================================================
// GET - Fetch program offerings with filters
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instituteId = searchParams.get('instituteId');
    const programId = searchParams.get('programId');
    const search = searchParams.get('search');
    const includePrograms = searchParams.get('includePrograms') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Build conditions safely
    const conditions = [];

    if (instituteId) {
      conditions.push(eq(programOfferings.instituteId, parseInt(instituteId)));
    }

    if (programId) {
      conditions.push(eq(programOfferings.programId, parseInt(programId)));
    }

    if (search) {
      conditions.push(
        or(
          like(programs.name, `%${search}%`),
          like(institutes.name, `%${search}%`)
        )
      );
    }

    // Build query
    let query = db
      .select({
        id: programOfferings.id,
        programId: programOfferings.programId,
        instituteId: programOfferings.instituteId,
        degreeId: programOfferings.degreeId,
        duration: programOfferings.duration,
        feeRange: programOfferings.feeRange,
        specificEligibility: programOfferings.specificEligibility,
        additionalInfo: programOfferings.additionalInfo,
        specializations: programOfferings.specializations,
        status: programOfferings.status,
        createdAt: programOfferings.createdAt,
        updatedAt: programOfferings.updatedAt,
        // Program details
        programName: programs.name,
        programSlug: programs.slug,
        programCategoryId: programs.categoryId,
        programDescription: programs.shortDescription,
        // Institute details
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteCityId: institutes.cityId,
        // Degree details
        degreeName: degrees.name,
        degreeSlug: degrees.slug,
        degreeFullForm: degrees.fullForm,
        // Level details
        levelId: levels.id,
        levelName: levels.name,
        levelSlug: levels.slug,
        // Category details
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(programOfferings)
      .leftJoin(programs, eq(programOfferings.programId, programs.id))
      .leftJoin(institutes, eq(programOfferings.instituteId, institutes.id))
      .leftJoin(degrees, eq(programOfferings.degreeId, degrees.id))
      .leftJoin(levels, eq(degrees.levelId, levels.id))
      .leftJoin(categories, eq(programs.categoryId, categories.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const offerings = await query
      .orderBy(programs.name)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = db
      .select({ count: db.$count(programOfferings.id) })
      .from(programOfferings);
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    
    const countResult = await countQuery;
    const totalCount = countResult[0]?.count || 0;

    // Transform offerings for frontend
    const transformedOfferings = offerings.map((offering) => ({
      id: offering.id,
      programId: offering.programId,
      programName: offering.programName || 'Unknown Program',
      programSlug: offering.programSlug,
      degreeId: offering.degreeId,
      degreeName: offering.degreeName || 'Unknown Degree',
      degreeFullForm: offering.degreeFullForm,
      levelId: offering.levelId,
      levelName: offering.levelName,
      levelSlug: offering.levelSlug,
      categoryId: offering.programCategoryId,
      categoryName: offering.categoryName,
      instituteId: offering.instituteId,
      instituteName: offering.instituteName || 'Unknown Institute',
      instituteSlug: offering.instituteSlug,
      duration: offering.duration,
      feeRange: offering.feeRange,
      specificEligibility: offering.specificEligibility,
      additionalInfo: offering.additionalInfo,
      specializations: offering.specializations,
      status: offering.status,
      createdAt: offering.createdAt,
      updatedAt: offering.updatedAt,
    }));

    // If includePrograms is true, also return unique programs list
    let uniquePrograms = [];
    if (includePrograms) {
      const programList = await db
        .select({
          id: programs.id,
          name: programs.name,
          slug: programs.slug,
          categoryId: programs.categoryId,
          categoryName: categories.name,
        })
        .from(programs)
        .leftJoin(categories, eq(programs.categoryId, categories.id))
        .where(eq(programs.status, true))
        .orderBy(programs.name);
      
      uniquePrograms = programList;
    }

    return NextResponse.json({
      success: true,
      offerings: transformedOfferings,
      uniquePrograms: includePrograms ? uniquePrograms : undefined,
      count: transformedOfferings.length,
      totalCount: totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error('❌ Error fetching program offerings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch program offerings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create a new program offering (with degree support)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Creating program offering:', body);

    // Validate required fields
    if (!body.programName && !body.programId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either programName or programId is required',
        },
        { status: 400 }
      );
    }

    if (!body.instituteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'instituteId is required',
        },
        { status: 400 }
      );
    }

    if (!body.degreeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'degreeId is required',
        },
        { status: 400 }
      );
    }

    let programId = body.programId;

    // If programName provided but no programId, create new program
    if (body.programName && !body.programId) {
      // Generate slug from program name
      const slug = body.programName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if program already exists
      const existingProgram = await db
        .select()
        .from(programs)
        .where(eq(programs.slug, slug))
        .limit(1);

      if (existingProgram.length > 0) {
        programId = existingProgram[0].id;
      } else {
        // Create new program
        const [newProgram] = await db
          .insert(programs)
          .values({
            name: body.programName,
            slug: slug,
            categoryId: body.categoryId || null,
            shortDescription: body.shortDescription || null,
            status: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        programId = newProgram.id;
      }
    }

    // Check if offering already exists for this program, degree, and institute
    const existingOffering = await db
      .select()
      .from(programOfferings)
      .where(
        and(
          eq(programOfferings.programId, programId),
          eq(programOfferings.degreeId, body.degreeId),
          eq(programOfferings.instituteId, body.instituteId)
        )
      )
      .limit(1);

    if (existingOffering.length > 0) {
      return NextResponse.json({
        success: true,
        offering: existingOffering[0],
        message: 'Program offering already exists',
        alreadyExists: true,
      });
    }

    // Create new offering
    const [newOffering] = await db
      .insert(programOfferings)
      .values({
        programId: programId,
        degreeId: body.degreeId,
        instituteId: body.instituteId,
        duration: body.duration || null,
        feeRange: body.feeRange || null,
        specificEligibility: body.specificEligibility || null,
        additionalInfo: body.additionalInfo || null,
        specializations: body.specializations || null,
        status: body.status !== undefined ? body.status : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Get program and degree names for response
    const program = await db
      .select({ name: programs.name })
      .from(programs)
      .where(eq(programs.id, programId))
      .limit(1);

    const degree = await db
      .select({ name: degrees.name })
      .from(degrees)
      .where(eq(degrees.id, body.degreeId))
      .limit(1);

    return NextResponse.json({
      success: true,
      offering: {
        id: newOffering.id,
        programId: programId,
        programName: program[0]?.name || body.programName || 'New Program',
        degreeId: body.degreeId,
        degreeName: degree[0]?.name || 'Unknown Degree',
        instituteId: body.instituteId,
        duration: body.duration,
        feeRange: body.feeRange,
        status: newOffering.status,
      },
      message: 'Program offering created successfully',
    });
  } catch (error) {
    console.error('❌ Error creating program offering:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create program offering',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - Update an existing program offering
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const [updatedOffering] = await db
      .update(programOfferings)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(programOfferings.id, id))
      .returning();

    if (!updatedOffering) {
      return NextResponse.json(
        { success: false, error: 'Program offering not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      offering: updatedOffering,
      message: 'Program offering updated successfully',
    });
  } catch (error) {
    console.error('❌ Error updating program offering:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update program offering',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Delete a program offering
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const [deletedOffering] = await db
      .delete(programOfferings)
      .where(eq(programOfferings.id, parseInt(id)))
      .returning();

    if (!deletedOffering) {
      return NextResponse.json(
        { success: false, error: 'Program offering not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      offering: deletedOffering,
      message: 'Program offering deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting program offering:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete program offering',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}