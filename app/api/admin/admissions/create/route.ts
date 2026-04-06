// app/api/admin/admissions/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { admissions, admissionOfferings, programOfferings, seoMetadata } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.name || !body.slug || !body.offeringIds || !body.instituteId || !body.year || !body.status) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          details: 'Name, slug, offeringIds (array), instituteId, year, and status are required' 
        },
        { status: 400 }
      );
    }

    // Ensure offeringIds is an array
    const offeringIds = Array.isArray(body.offeringIds) ? body.offeringIds : [body.offeringIds];
    
    if (offeringIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one offering is required' },
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

    // Verify that all offeringIds exist
    const validOfferings = await db
      .select({ id: programOfferings.id })
      .from(programOfferings)
      .where(eq(programOfferings.id, offeringIds));

    if (validOfferings.length !== offeringIds.length) {
      return NextResponse.json(
        { error: 'Invalid offering IDs', details: 'One or more offering IDs do not exist' },
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
          featuredImage: body.featuredImage || null,
          galleryImages: body.galleryImages && body.galleryImages.length > 0 ? body.galleryImages : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 2. Insert into junction table for each offering
      const junctionRecords = await Promise.all(
        offeringIds.map(async (offeringId: number) => {
          const [record] = await tx
            .insert(admissionOfferings)
            .values({
              admissionId: newAdmission.id,
              offeringId: Number(offeringId),
              status: true,
              createdAt: new Date(),
            })
            .returning();
          return record;
        })
      );

      // 3. Insert SEO metadata
      let seoRecord = null;
      const hasSeoData = body.metaTitle || body.metaDescription || body.canonicalUrl;
      
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
            ogImage: body.ogImage || body.featuredImage || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        seoRecord = newSeo;
      }

      return { newAdmission, junctionRecords, seoRecord };
    });

    return NextResponse.json({
      success: true,
      admission: result.newAdmission,
      offeringCount: result.junctionRecords.length,
      seo: result.seoRecord ? 'created' : 'skipped',
      message: `Admission created successfully with ${result.junctionRecords.length} offering(s)`
    });

  } catch (error: any) {
    console.error('❌ Error creating admission:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      if (error.message?.includes('admissions_slug_unique')) {
        return NextResponse.json(
          { 
            error: 'Duplicate slug', 
            details: 'An admission with this slug already exists. Please use a different slug.' 
          },
          { status: 400 }
        );
      }
      if (error.message?.includes('admission_offerings_admission_id_offering_id_unique')) {
        return NextResponse.json(
          { 
            error: 'Duplicate offering', 
            details: 'This offering is already linked to this admission.' 
          },
          { status: 400 }
        );
      }
      if (error.message?.includes('seo_metadata_entity_type_entity_id_unique')) {
        return NextResponse.json(
          { 
            error: 'Duplicate SEO record', 
            details: 'SEO metadata already exists for this admission.' 
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
          details: 'One or more offering IDs or institute ID do not exist.' 
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