// app/api/admin/programs/create/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programs, seoMetadata } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {

  try {
    // Parse request body
    const body = await request.json().catch(e => {
      console.error("❌ Invalid JSON:", e);
      return NextResponse.json(
        { success: false, error: "Invalid JSON format" },
        { status: 400 }
      );
    });

    // Agar error response mil gaya to return karo
    if (body instanceof NextResponse) return body;

    const { 
      // Basic Info
      name, 
      slug, 
      categoryId,
      
      // Rich Content
      shortDescription,
      detailedOverview,
      whatYouLearn,
      whyStudyThis,
      careerOutlook,
      industryDemand,
      
      // Typical Info
      typicalDuration,
      typicalFeeRange,
      commonEligibility,
      
      // Media
      featuredImage,
      icon,
      
      // Stats
      totalOfferings,
      totalAdmissionsOpen,
      averageSalaryRange,
      
      // Settings
      isFeatured,
      isPopular,
      status,
      
      // SEO fields
      metaTitle,
      metaDescription,
      focusKeyword,
      introVideoUrl,
      graduatesCount,
      placementRate,
      
      // Legacy fields (for backward compatibility)
      overview,           // will map to detailedOverview
      eligibility,        // will map to commonEligibility
      duration,           // will map to typicalDuration
      careerScope,        // will map to careerOutlook
      feeRange,           // will map to typicalFeeRange
      
      // SEO metadata (separate table)
      canonicalUrl,
      robots,
      ogTitle,
      ogDescription,
      ogImage
    } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Name and slug are required" 
        }, 
        { status: 400 }
      );
    }

    // Check for existing slug
    const existing = await db
      .select()
      .from(programs)
      .where(eq(programs.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Slug already exists. Please use a different slug." 
        }, 
        { status: 400 }
      );
    }

    // Map legacy fields to new schema
    const finalDetailedOverview = detailedOverview || overview || null;
    const finalCommonEligibility = commonEligibility || eligibility || null;
    const finalTypicalDuration = typicalDuration || duration || null;
    const finalCareerOutlook = careerOutlook || careerScope || null;
    const finalTypicalFeeRange = typicalFeeRange || feeRange || null;

    // Insert new program
    const newProgram = await db.insert(programs).values({
      // Basic Info
      name,
      slug,
      categoryId: categoryId ? Number(categoryId) : null,
      
      // Rich Content
      shortDescription: shortDescription || null,
      detailedOverview: finalDetailedOverview,
      whatYouLearn: whatYouLearn || null,
      whyStudyThis: whyStudyThis || null,
      careerOutlook: finalCareerOutlook,
      industryDemand: industryDemand || null,
      
      // Typical Info
      typicalDuration: finalTypicalDuration,
      typicalFeeRange: finalTypicalFeeRange,
      commonEligibility: finalCommonEligibility,
      
      // Media
      featuredImage: featuredImage || null,
      icon: icon || null,
      
      // Stats
      totalOfferings: totalOfferings ? Number(totalOfferings) : 0,
      totalAdmissionsOpen: totalAdmissionsOpen ? Number(totalAdmissionsOpen) : 0,
      averageSalaryRange: averageSalaryRange || null,
      
      // Settings
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
      isPopular: isPopular !== undefined ? Boolean(isPopular) : false,
      status: status !== undefined ? Boolean(status) : true,
      
      // SEO fields (in programs table)
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      focusKeyword: focusKeyword || null,
      introVideoUrl: introVideoUrl || null,
      graduatesCount: graduatesCount ? Number(graduatesCount) : null,
      placementRate: placementRate ? Number(placementRate) : null,
      
    }).returning();

    const createdProgram = newProgram[0];

    // Create SEO metadata (in seo_metadata table)
    let createdSeo = null;
    if (metaTitle || metaDescription || canonicalUrl || ogTitle || ogDescription || ogImage) {
      try {
        const seoData = {
          entityType: 'program',
          entityId: createdProgram.id,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          canonicalUrl: canonicalUrl || null,
          robots: robots || 'index, follow',
          ogTitle: ogTitle || null,
          ogDescription: ogDescription || null,
          ogImage: ogImage || null,
        };

        const seoResult = await db
          .insert(seoMetadata)
          .values(seoData)
          .returning();
        
        createdSeo = seoResult[0];
      } catch (seoErr) {
        console.error("❌ Error creating SEO metadata:", seoErr);
        // Don't fail the whole request if SEO creation fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      program: {
        ...createdProgram,
        seo: createdSeo,
      },
      message: "Program created successfully" 
    });

  } catch (error) {
    console.error("❌ POST error:", error);
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "A program with this slug already exists" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
    
  } finally {
  }
}