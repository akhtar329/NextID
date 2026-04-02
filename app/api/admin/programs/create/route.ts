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
      name, 
      slug, 
      degreeId, 
      overview, 
      eligibility, 
      duration, 
      careerScope, 
      feeRange, 
      // ❌ REMOVED: seoTitle, seoDescription
      isFeatured,
      status,
      // SEO fields (now handled separately)
      metaTitle,
      metaDescription,
      seoTitle,      // Legacy field name support
      seoDescription, // Legacy field name support
      canonicalUrl,
      robots,
      ogTitle,
      ogDescription,
      ogImage
    } = body;

    // Validate required fields
    if (!name || !slug || !degreeId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Name, slug, and degreeId are required" 
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

    // Insert new program (without SEO columns)
    const newProgram = await db.insert(programs).values({
      name,
      slug,
      degreeId: Number(degreeId),
      overview: overview || null,
      eligibility: eligibility || null,
      duration: duration || null,
      careerScope: careerScope || null,
      feeRange: feeRange || null,
      // ❌ REMOVED: seoTitle, seoDescription
      isFeatured: isFeatured || false,
      status: status !== undefined ? status : true,
      // created_at and updated_at automatically set by database default
    }).returning();

    const createdProgram = newProgram[0];

    // Create SEO metadata if provided
    let createdSeo = null;
    const finalMetaTitle = metaTitle || seoTitle || null;
    const finalMetaDescription = metaDescription || seoDescription || null;

    if (finalMetaTitle || finalMetaDescription || canonicalUrl || ogTitle || ogDescription) {
      try {
        const seoData = {
          entityType: 'program',
          entityId: createdProgram.id,
          metaTitle: finalMetaTitle,
          metaDescription: finalMetaDescription,
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
        // Just log the error and continue
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