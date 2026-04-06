// app/lib/seed.ts - Updated Version for New Schema

import { db } from "./db";
import { 
  categories, levels, degrees, programs, cities, institutes, 
  boards, programOfferings, admissions, admissionOfferings,
  adminRoles, adminUsers, seoMetadata
} from "./schema";
import { eq, sql } from "drizzle-orm";
import { hash } from "bcryptjs";

async function seed() {

  try {
    /* =========================
       FIRST: Delete existing data in correct order
       ========================= */
    
    // Pehle child tables delete karo
    await db.delete(admissionOfferings);  // ✅ Updated
    await db.delete(programOfferings);     // ✅ Updated (replaces programInstitutes)
    await db.delete(admissions);
    await db.delete(seoMetadata);
    
    // Phir parent tables
    await db.delete(programs);
    await db.delete(institutes);
    await db.delete(cities);
    await db.delete(boards);
    await db.delete(degrees);
    await db.delete(levels);
    await db.delete(categories);
    
    // Last mein admin tables
    await db.delete(adminUsers);
    await db.delete(adminRoles);

    /* =========================
       1. ADMIN ROLES
       ========================= */
    
    await db.insert(adminRoles).values([
      { id: 1, name: "SuperAdmin", description: "Full access", status: true },
      { id: 2, name: "Editor", description: "Content edit access", status: true },
    ]);

    /* =========================
       2. ADMIN USERS
       ========================= */
    const hashedPassword = await hash("Admin@123456", 10);
    
    await db.insert(adminUsers).values([
      {
        name: "Super Admin",
        email: "admin@nextid.pk",
        password: hashedPassword,
        roleId: 1,
        status: true,
      },
    ]);

    /* =========================
       3. CATEGORIES
       ========================= */
    await db.insert(categories).values([
      { id: 1, name: "Engineering", slug: "engineering", displayOrder: 1, status: true },
      { id: 2, name: "Medical", slug: "medical", displayOrder: 2, status: true },
      { id: 3, name: "Business", slug: "business", displayOrder: 3, status: true },
      { id: 4, name: "Computer / IT", slug: "computer-it", displayOrder: 4, status: true },
      { id: 5, name: "Law", slug: "law", displayOrder: 5, status: true },
      { id: 6, name: "Education", slug: "education", displayOrder: 6, status: true },
      { id: 7, name: "Arts", slug: "arts", displayOrder: 7, status: true },
    ]);

    /* =========================
       4. LEVELS
       ========================= */
    await db.insert(levels).values([
      { id: 1, name: "Matric", slug: "matric", displayOrder: 1, status: true },
      { id: 2, name: "Intermediate", slug: "intermediate", displayOrder: 2, status: true },
      { id: 3, name: "Bachelor", slug: "bachelor", displayOrder: 3, status: true },
      { id: 4, name: "Master", slug: "master", displayOrder: 4, status: true },
      { id: 5, name: "PhD", slug: "phd", displayOrder: 5, status: true },
    ]);

    /* =========================
       5. DEGREES - ✅ REMOVED categoryId
       ========================= */
    await db.insert(degrees).values([
      { id: 1, name: "BS", slug: "bs", fullForm: "Bachelor of Science", levelId: 3, displayOrder: 1, status: true },
      { id: 2, name: "BE", slug: "be", fullForm: "Bachelor of Engineering", levelId: 3, displayOrder: 1, status: true },
      { id: 3, name: "BBA", slug: "bba", fullForm: "Bachelor of Business Admin", levelId: 3, displayOrder: 1, status: true },
      { id: 4, name: "MBBS", slug: "mbbs", fullForm: "Bachelor of Medicine & Surgery", levelId: 3, displayOrder: 1, status: true },
      { id: 5, name: "LLB", slug: "llb", fullForm: "Bachelor of Laws", levelId: 3, displayOrder: 1, status: true },
      { id: 6, name: "B.Ed", slug: "bed", fullForm: "Bachelor of Education", levelId: 3, displayOrder: 1, status: true },
      { id: 7, name: "BA", slug: "ba", fullForm: "Bachelor of Arts", levelId: 3, displayOrder: 1, status: true },
      { id: 8, name: "MA", slug: "ma", fullForm: "Master of Arts", levelId: 4, displayOrder: 2, status: true },
      { id: 9, name: "MBA", slug: "mba", fullForm: "Master of Business Admin", levelId: 4, displayOrder: 2, status: true },
      { id: 10, name: "MSc", slug: "msc", fullForm: "Master of Science", levelId: 4, displayOrder: 2, status: true },
      { id: 11, name: "ME", slug: "me", fullForm: "Master of Engineering", levelId: 4, displayOrder: 2, status: true },
      { id: 12, name: "PhD", slug: "phd", fullForm: "Doctor of Philosophy", levelId: 5, displayOrder: 3, status: true },
    ]);

    /* =========================
       6. CITIES
       ========================= */
    await db.insert(cities).values([
      { id: 1, name: "Karachi", slug: "karachi", province: "Sindh", isPopular: true, status: true },
      { id: 2, name: "Lahore", slug: "lahore", province: "Punjab", isPopular: true, status: true },
      { id: 3, name: "Islamabad", slug: "islamabad", province: "ICT", isPopular: true, status: true },
      { id: 4, name: "Rawalpindi", slug: "rawalpindi", province: "Punjab", isPopular: false, status: true },
      { id: 5, name: "Faisalabad", slug: "faisalabad", province: "Punjab", isPopular: false, status: true },
      { id: 6, name: "Multan", slug: "multan", province: "Punjab", isPopular: false, status: true },
      { id: 7, name: "Peshawar", slug: "peshawar", province: "KPK", isPopular: false, status: true },
      { id: 8, name: "Quetta", slug: "quetta", province: "Balochistan", isPopular: false, status: true },
      { id: 9, name: "Hyderabad", slug: "hyderabad", province: "Sindh", isPopular: false, status: true },
      { id: 10, name: "Sukkur", slug: "sukkur", province: "Sindh", isPopular: false, status: true },
    ]);

    /* =========================
       7. INSTITUTES
       ========================= */
    await db.insert(institutes).values([
      // Karachi
      { id: 1, name: "University of Karachi", slug: "university-of-karachi", type: "Public", cityId: 1, isFeatured: true, status: true },
      { id: 2, name: "IBA Karachi", slug: "iba-karachi", type: "Public", cityId: 1, isFeatured: true, status: true },
      { id: 3, name: "NED University", slug: "ned-university", type: "Public", cityId: 1, isFeatured: true, status: true },
      { id: 4, name: "Dow University", slug: "dow-university", type: "Public", cityId: 1, isFeatured: false, status: true },
      
      // Lahore
      { id: 5, name: "University of the Punjab", slug: "university-of-punjab", type: "Public", cityId: 2, isFeatured: true, status: true },
      { id: 6, name: "LUMS", slug: "lums", type: "Private", cityId: 2, isFeatured: true, status: true },
      { id: 7, name: "UET Lahore", slug: "uet-lahore", type: "Public", cityId: 2, isFeatured: true, status: true },
      { id: 8, name: "GC University Lahore", slug: "gc-university-lahore", type: "Public", cityId: 2, isFeatured: false, status: true },
      { id: 9, name: "University of Education", slug: "university-of-education", type: "Public", cityId: 2, isFeatured: false, status: true },
      { id: 10, name: "Lahore College for Women", slug: "lcwu", type: "Public", cityId: 2, isFeatured: false, status: true },

      // Islamabad
      { id: 11, name: "NUST", slug: "nust", type: "Public", cityId: 3, isFeatured: true, status: true },
      { id: 12, name: "FAST NUCES", slug: "fast-nuces", type: "Private", cityId: 3, isFeatured: true, status: true },
      { id: 13, name: "Quaid-e-Azam University", slug: "qau", type: "Public", cityId: 3, isFeatured: true, status: true },
      { id: 14, name: "COMSATS University", slug: "comsats", type: "Public", cityId: 3, isFeatured: true, status: true },
      { id: 15, name: "Air University", slug: "air-university", type: "Public", cityId: 3, isFeatured: false, status: true },

      // Peshawar
      { id: 16, name: "University of Peshawar", slug: "university-of-peshawar", type: "Public", cityId: 7, isFeatured: true, status: true },
      { id: 17, name: "Khyber Medical University", slug: "kmu", type: "Public", cityId: 7, isFeatured: false, status: true },

      // Quetta
      { id: 18, name: "University of Balochistan", slug: "university-of-balochistan", type: "Public", cityId: 8, isFeatured: false, status: true },
    ]);

    /* =========================
       8. BOARDS
       ========================= */
    await db.insert(boards).values([
      { id: 1, name: "FBISE Islamabad", slug: "fbise", cityId: 3, status: true },
      { id: 2, name: "BISE Karachi", slug: "bise-karachi", cityId: 1, status: true },
      { id: 3, name: "BISE Lahore", slug: "bise-lahore", cityId: 2, status: true },
      { id: 4, name: "BISE Rawalpindi", slug: "bise-rawalpindi", cityId: 4, status: true },
      { id: 5, name: "BISE Peshawar", slug: "bise-peshawar", cityId: 7, status: true },
      { id: 6, name: "BISE Quetta", slug: "bise-quetta", cityId: 8, status: true },
      { id: 7, name: "BISE Multan", slug: "bise-multan", cityId: 6, status: true },
      { id: 8, name: "BISE Faisalabad", slug: "bise-faisalabad", cityId: 5, status: true },
      { id: 9, name: "BISE Hyderabad", slug: "bise-hyderabad", cityId: 9, status: true },
      { id: 10, name: "BISE Sukkur", slug: "bise-sukkur", cityId: 10, status: true },
    ]);

    /* =========================
       9. PROGRAMS - ✅ REMOVED degreeId, ADDED categoryId
       ========================= */
    
    let programId = 1;
    const programValues = [
      // Engineering Programs (categoryId: 1)
      { categoryId: 1, name: "Civil Engineering", slug: "civil-engineering", isFeatured: true, shortDescription: "Study of civil infrastructure" },
      { categoryId: 1, name: "Mechanical Engineering", slug: "mechanical-engineering", isFeatured: true, shortDescription: "Study of mechanical systems" },
      { categoryId: 1, name: "Electrical Engineering", slug: "electrical-engineering", isFeatured: true, shortDescription: "Study of electrical systems" },
      { categoryId: 1, name: "Software Engineering", slug: "software-engineering", isFeatured: true, shortDescription: "Study of software development" },
      { categoryId: 1, name: "Chemical Engineering", slug: "chemical-engineering", isFeatured: false, shortDescription: "Study of chemical processes" },
      { categoryId: 1, name: "Computer Engineering", slug: "computer-engineering", isFeatured: false, shortDescription: "Study of computer hardware" },

      // Medical Programs (categoryId: 2)
      { categoryId: 2, name: "MBBS", slug: "mbbs", isFeatured: true, shortDescription: "Bachelor of Medicine and Surgery" },
      { categoryId: 2, name: "BDS", slug: "bds", isFeatured: true, shortDescription: "Bachelor of Dental Surgery" },
      { categoryId: 2, name: "Pharm-D", slug: "pharm-d", isFeatured: false, shortDescription: "Doctor of Pharmacy" },
      { categoryId: 2, name: "BS Nursing", slug: "bs-nursing", isFeatured: false, shortDescription: "Bachelor of Nursing" },

      // Business Programs (categoryId: 3)
      { categoryId: 3, name: "BBA", slug: "bba", isFeatured: true, shortDescription: "Bachelor of Business Administration" },
      { categoryId: 3, name: "MBA", slug: "mba", isFeatured: true, shortDescription: "Master of Business Administration" },
      { categoryId: 3, name: "BS Accounting", slug: "bs-accounting", isFeatured: false, shortDescription: "Bachelor of Accounting" },
      { categoryId: 3, name: "BS Economics", slug: "bs-economics", isFeatured: false, shortDescription: "Bachelor of Economics" },

      // IT Programs (categoryId: 4)
      { categoryId: 4, name: "BS Computer Science", slug: "bs-computer-science", isFeatured: true, shortDescription: "Bachelor of Computer Science" },
      { categoryId: 4, name: "BS Information Technology", slug: "bs-information-technology", isFeatured: true, shortDescription: "Bachelor of Information Technology" },
      { categoryId: 4, name: "MS Data Science", slug: "ms-data-science", isFeatured: true, shortDescription: "Master of Data Science" },
      { categoryId: 4, name: "MS Artificial Intelligence", slug: "ms-ai", isFeatured: true, shortDescription: "Master of AI" },
      { categoryId: 4, name: "BS Cyber Security", slug: "bs-cyber-security", isFeatured: false, shortDescription: "Bachelor of Cyber Security" },
      { categoryId: 4, name: "PhD Computer Science", slug: "phd-cs", isFeatured: false, shortDescription: "PhD in Computer Science" },

      // Law Programs (categoryId: 5)
      { categoryId: 5, name: "LLB (5-Year)", slug: "llb-5-year", isFeatured: true, shortDescription: "Bachelor of Laws 5-Year" },
      { categoryId: 5, name: "LLB (3-Year)", slug: "llb-3-year", isFeatured: false, shortDescription: "Bachelor of Laws 3-Year" },
      { categoryId: 5, name: "LLM", slug: "llm", isFeatured: false, shortDescription: "Master of Laws" },

      // Education Programs (categoryId: 6)
      { categoryId: 6, name: "B.Ed", slug: "bed", isFeatured: true, shortDescription: "Bachelor of Education" },
      { categoryId: 6, name: "M.Ed", slug: "med", isFeatured: true, shortDescription: "Master of Education" },
      { categoryId: 6, name: "BS Education", slug: "bs-education", isFeatured: false, shortDescription: "Bachelor of Education" },

      // Arts Programs (categoryId: 7)
      { categoryId: 7, name: "BA", slug: "ba", isFeatured: true, shortDescription: "Bachelor of Arts" },
      { categoryId: 7, name: "MA English", slug: "ma-english", isFeatured: true, shortDescription: "Master of English" },
      { categoryId: 7, name: "MA History", slug: "ma-history", isFeatured: false, shortDescription: "Master of History" },
      { categoryId: 7, name: "BS Psychology", slug: "bs-psychology", isFeatured: true, shortDescription: "Bachelor of Psychology" },
      { categoryId: 7, name: "BS Sociology", slug: "bs-sociology", isFeatured: false, shortDescription: "Bachelor of Sociology" },
      { categoryId: 7, name: "BS Mass Communication", slug: "bs-mass-comm", isFeatured: false, shortDescription: "Bachelor of Mass Communication" },
    ];

    for (const prog of programValues) {
      await db.insert(programs).values({
        id: programId++,
        categoryId: prog.categoryId,
        name: prog.name,
        slug: prog.slug,
        shortDescription: prog.shortDescription,
        isFeatured: prog.isFeatured,
        status: true
      });
    }

    /* =========================
       10. PROGRAM OFFERINGS (replaces programInstitutes) - WITH degreeId
       ========================= */
    const allPrograms = await db.select().from(programs);
    const allInstitutes = await db.select().from(institutes);
    const allDegrees = await db.select().from(degrees);

    let relationCount = 0;
    for (const program of allPrograms) {
      const shuffled = [...allInstitutes].sort(() => 0.5 - Math.random());
      const selectedInstitutes = shuffled.slice(0, Math.floor(Math.random() * 3) + 3);
      
      for (const institute of selectedInstitutes) {
        // Select a random degree for this offering
        const randomDegree = allDegrees[Math.floor(Math.random() * allDegrees.length)];
        
        await db.insert(programOfferings).values({
          programId: program.id,
          instituteId: institute.id,
          degreeId: randomDegree.id,
          status: true
        }).catch(() => {});
        relationCount++;
      }
    }

    /* =========================
       11. ADMISSIONS
       ========================= */
    const currentYear = new Date().getFullYear();
    let admissionCount = 0;
    const admissionIds: number[] = [];
    
    // Create 15 admissions
    for (let i = 0; i < 15; i++) {
      const randomInstitute = allInstitutes[Math.floor(Math.random() * allInstitutes.length)];
      if (!randomInstitute) continue;
      
      const instituteName = randomInstitute.name;
      const session = i % 3 === 0 ? "Spring" : i % 3 === 1 ? "Fall" : "Summer";
      const status = i % 4 === 0 ? "Expected" : i % 4 === 1 ? "Closed" : "Open";
      
      // Generate clean slug
      const slugBase = `${instituteName} ${session} Admissions ${currentYear}`;
      const slug = slugBase
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Insert admission
      const [admission] = await db.insert(admissions).values({
        instituteId: randomInstitute.id,
        name: `${instituteName} ${session} Admissions ${currentYear}`,
        slug: slug,
        year: currentYear,
        session: session,
        status: status,
        expectedOpenDate: status === "Expected" ? new Date(currentYear, 1, 15) : null,
        expectedCloseDate: status === "Open" ? new Date(currentYear, 8, 30) : 
                          status === "Expected" ? new Date(currentYear, 3, 15) : null,
        officialLink: "https://www.example.edu/admissions",
      }).returning({ id: admissions.id });
      
      if (admission) {
        admissionIds.push(admission.id);
        admissionCount++;
      }
    }

    /* =========================
       12. ADMISSION OFFERINGS (replaces admissionPrograms) - Link admissions to offerings
       ========================= */
    const allOfferings = await db.select().from(programOfferings);
    let admissionOfferingCount = 0;
    
    // For each admission, link it to 1-4 random offerings
    for (const admissionId of admissionIds) {
      const numOfferings = Math.floor(Math.random() * 4) + 1;
      
      const shuffled = [...allOfferings].sort(() => 0.5 - Math.random());
      const selectedOfferings = shuffled.slice(0, numOfferings);
      
      for (const offering of selectedOfferings) {
        await db.insert(admissionOfferings).values({
          admissionId: admissionId,
          offeringId: offering.id,
          status: true,
        }).catch((err) => {
          if (!err.message?.includes('duplicate')) {
            console.error("Failed to insert admission-offering relation:", err);
          }
        });
        admissionOfferingCount++;
      }
    }

    /* =========================
       📊 SUMMARY
       ========================= */
    const finalCategories = await db.select().from(categories);
    const finalPrograms = await db.select().from(programs);
    const finalInstitutes = await db.select().from(institutes);
    const finalCities = await db.select().from(cities);
    const finalOfferings = await db.select().from(programOfferings);
    const finalAdmissions = await db.select().from(admissions);
    const finalAdmissionOfferings = await db.select().from(admissionOfferings);

    console.log("✅ Seed completed successfully!");
    console.log(`📊 Summary: ${finalCategories.length} categories, ${finalPrograms.length} programs, ${finalInstitutes.length} institutes, ${finalOfferings.length} offerings, ${finalAdmissions.length} admissions, ${finalAdmissionOfferings.length} admission-offerings`);

  } catch (error) {
    console.error("❌ Error during seed:", error);
    throw error;
  }
}

seed().catch(console.error);