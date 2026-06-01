import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { db } from '@/db/db';
import { admissions, admissionOfferings, programOfferings, seoMetadata } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    const requiredFields = ['name', 'slug', 'offeringIds', 'instituteId', 'year', 'status'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          details: `${missingFields.join(', ')} are required` 
        },
        { status: 400 }
      );
    }

    // Ensure offeringIds is an array
    const offeringIds: number[] = Array.isArray(body.offeringIds) ? body.offeringIds : [body.offeringIds];
    
    if (offeringIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one program offering is required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
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

    // Validate offerings exist
    const validOfferings = await db
      .select({ 
        id: programOfferings.id,
        instituteId: programOfferings.instituteId 
      })
      .from(programOfferings)
      .where(inArray(programOfferings.id, offeringIds));

    if (validOfferings.length !== offeringIds.length) {
      const foundIds = validOfferings.map((o: { id: number }) => o.id);
      const missingIds = offeringIds.filter((id: number) => !foundIds.includes(id));
      return NextResponse.json(
        { 
          error: 'Invalid offering IDs', 
          details: `Offering IDs ${missingIds.join(', ')} do not exist` 
        },
        { status: 400 }
      );
    }

    // Verify all offerings belong to the selected institute
    const invalidInstituteOfferings = validOfferings.filter(
      (offering: { id: number; instituteId: number }) => offering.instituteId !== body.instituteId
    );
    
    if (invalidInstituteOfferings.length > 0) {
      const invalidIds = invalidInstituteOfferings.map((o: { id: number }) => o.id);
      return NextResponse.json(
        { 
          error: 'Offering does not belong to institute', 
          details: `Offerings ${invalidIds.join(', ')} do not belong to institute ${body.instituteId}` 
        },
        { status: 400 }
      );
    }

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create admission
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

      // 2. Insert into junction table for each offering
      const junctionRecords = [];
      for (const offeringId of offeringIds) {
        const [record] = await tx
          .insert(admissionOfferings)
          .values({
            admissionId: newAdmission.id,
            offeringId: Number(offeringId),
            status: true,
            createdAt: new Date(),
          })
          .returning();
        junctionRecords.push(record);
      }

      // 3. Insert SEO metadata
      let seoRecord = null;
      const hasSeoData = body.metaTitle || body.metaDescription || body.canonicalUrl || body.ogTitle || body.ogDescription;
      
      if (hasSeoData) {
        const [newSeo] = await tx
          .insert(seoMetadata)
          .values({
            entityType: 'admission',
            entityId: newAdmission.id,
            metaTitle: body.metaTitle || null,
            metaDescription: body.metaDescription || null,
            metaKeywords: body.metaKeywords || null,
            canonicalUrl: body.canonicalUrl || null,
            robots: body.robots || 'index, follow',
            ogTitle: body.ogTitle || body.metaTitle || null,
            ogDescription: body.ogDescription || body.metaDescription || null,
            ogImage: body.ogImage || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        seoRecord = newSeo;
      }

      return { newAdmission, junctionRecords, seoRecord };
    });

    // ✅ CACHE CLEAR for Next.js 15
    revalidateTag("admissions", request.url);
    revalidateTag("admissions:stats", request.url);

    console.log('✅ Cache cleared for tags: admissions, admissions:stats');

    return NextResponse.json({
      success: true,
      admission: {
        id: result.newAdmission.id,
        name: result.newAdmission.name,
        slug: result.newAdmission.slug,
        year: result.newAdmission.year,
        status: result.newAdmission.status,
      },
      offeringCount: result.junctionRecords.length,
      seo: result.seoRecord ? 'created' : 'skipped',
      message: `Admission created successfully with ${result.junctionRecords.length} program offering(s)`,
      cacheCleared: true
    });

  } catch (error: unknown) {
    console.error('❌ Error creating admission:', error);
    
    const err = error as { code?: string; message?: string };
    
    // Handle unique constraint violation
    if (err.code === '23505') {
      if (err.message?.includes('admissions_slug_unique')) {
        return NextResponse.json(
          { 
            error: 'Duplicate slug', 
            details: 'An admission with this slug already exists. Please use a different slug.' 
          },
          { status: 400 }
        );
      }
      if (err.message?.includes('admission_offerings_admission_id_offering_id_unique')) {
        return NextResponse.json(
          { 
            error: 'Duplicate offering', 
            details: 'This program offering is already linked to this admission.' 
          },
          { status: 400 }
        );
      }
    }

    // Handle foreign key violation
    if (err.code === '23503') {
      return NextResponse.json(
        { 
          error: 'Invalid reference', 
          details: 'Institute ID or offering ID does not exist in the database.' 
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Failed to create admission', 
        details: err.message || 'Unknown error',
        code: err.code 
      },
      { status: 500 }
    );
  }
}