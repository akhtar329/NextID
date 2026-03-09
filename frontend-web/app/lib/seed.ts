// app/lib/seed.ts - Fixed Version with Proper ID Handling

import { db } from "./db";
import { 
  categories, levels, degrees, programs, cities, institutes, 
  boards, programInstitutes, programCities, admissions, adminRoles, adminUsers
} from "./schema";
import { eq, sql } from "drizzle-orm";
import { hash } from "bcryptjs";

async function seed() {
  console.log("🌱 Starting seed...");

  try {
    /* =========================
       FIRST: Delete existing data in correct order
       ========================= */
    console.log("🗑️ Cleaning up existing data...");
    
    // Pehle child tables delete karo
    await db.delete(programCities);
    await db.delete(programInstitutes);
    await db.delete(admissions);
    
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
    
    console.log("✅ Cleanup complete");

    /* =========================
       1. ADMIN ROLES - Manual ID insert
       ========================= */
    console.log("Creating admin roles...");
    
    // Manually insert with specific IDs
    await db.insert(adminRoles).values([
      { id: 1, name: "SuperAdmin", description: "Full access", status: true },
      { id: 2, name: "Editor", description: "Content edit access", status: true },
    ]);
    
    console.log("✅ Admin roles created");

    /* =========================
       2. ADMIN USERS - Ab ye insert karo (role_id 1 exist karta hai)
       ========================= */
    console.log("Creating admin user...");
    const hashedPassword = await hash("Admin@123456", 10);
    
    await db.insert(adminUsers).values([
      {
        name: "Super Admin",
        email: "admin@nextid.pk",
        password: hashedPassword,
        roleId: 1,  // Ab ye exist karta hai
        status: true,
      },
    ]);
    console.log("✅ Admin user created");

    /* =========================
       3. CATEGORIES
       ========================= */
    console.log("Creating categories...");
    await db.insert(categories).values([
      { id: 1, name: "Engineering", slug: "engineering", displayOrder: 1, status: true },
      { id: 2, name: "Medical", slug: "medical", displayOrder: 2, status: true },
      { id: 3, name: "Business", slug: "business", displayOrder: 3, status: true },
      { id: 4, name: "Computer / IT", slug: "computer-it", displayOrder: 4, status: true },
      { id: 5, name: "Law", slug: "law", displayOrder: 5, status: true },
      { id: 6, name: "Education", slug: "education", displayOrder: 6, status: true },
      { id: 7, name: "Arts", slug: "arts", displayOrder: 7, status: true },
    ]);
    console.log("✅ Categories created");

    /* =========================
       4. LEVELS
       ========================= */
    console.log("Creating levels...");
    await db.insert(levels).values([
      { id: 1, name: "Matric", slug: "matric", displayOrder: 1, status: true },
      { id: 2, name: "Intermediate", slug: "intermediate", displayOrder: 2, status: true },
      { id: 3, name: "Bachelor", slug: "bachelor", displayOrder: 3, status: true },
      { id: 4, name: "Master", slug: "master", displayOrder: 4, status: true },
      { id: 5, name: "PhD", slug: "phd", displayOrder: 5, status: true },
    ]);
    console.log("✅ Levels created");

    /* =========================
       5. DEGREES
       ========================= */
    console.log("Creating degrees...");
    await db.insert(degrees).values([
      { id: 1, name: "BS", fullForm: "Bachelor of Science", levelId: 3, categoryId: 4, displayOrder: 1, status: true },
      { id: 2, name: "BE", fullForm: "Bachelor of Engineering", levelId: 3, categoryId: 1, displayOrder: 1, status: true },
      { id: 3, name: "BBA", fullForm: "Bachelor of Business Admin", levelId: 3, categoryId: 3, displayOrder: 1, status: true },
      { id: 4, name: "MBBS", fullForm: "Bachelor of Medicine & Surgery", levelId: 3, categoryId: 2, displayOrder: 1, status: true },
      { id: 5, name: "LLB", fullForm: "Bachelor of Laws", levelId: 3, categoryId: 5, displayOrder: 1, status: true },
      { id: 6, name: "B.Ed", fullForm: "Bachelor of Education", levelId: 3, categoryId: 6, displayOrder: 1, status: true },
      { id: 7, name: "BA", fullForm: "Bachelor of Arts", levelId: 3, categoryId: 7, displayOrder: 1, status: true },
      { id: 8, name: "MA", fullForm: "Master of Arts", levelId: 4, categoryId: 7, displayOrder: 2, status: true },
      { id: 9, name: "MBA", fullForm: "Master of Business Admin", levelId: 4, categoryId: 3, displayOrder: 2, status: true },
      { id: 10, name: "MSc", fullForm: "Master of Science", levelId: 4, categoryId: 4, displayOrder: 2, status: true },
      { id: 11, name: "ME", fullForm: "Master of Engineering", levelId: 4, categoryId: 1, displayOrder: 2, status: true },
      { id: 12, name: "PhD", fullForm: "Doctor of Philosophy", levelId: 5, categoryId: 4, displayOrder: 3, status: true },
    ]);
    console.log("✅ Degrees created");

    /* =========================
       6. CITIES
       ========================= */
    console.log("Creating cities...");
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
    console.log("✅ Cities created");

    /* =========================
       7. INSTITUTES
       ========================= */
    console.log("Creating institutes...");
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
    console.log("✅ Institutes created");

    /* =========================
       8. BOARDS
       ========================= */
    console.log("Creating boards...");
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
    console.log("✅ Boards created");

    /* =========================
       9. PROGRAMS
       ========================= */
    console.log("Creating programs...");
    
    // Programs with IDs
    let programId = 1;
    const programValues = [
      // Engineering Programs
      { degreeId: 2, name: "Civil Engineering", slug: "civil-engineering", isFeatured: true },
      { degreeId: 2, name: "Mechanical Engineering", slug: "mechanical-engineering", isFeatured: true },
      { degreeId: 2, name: "Electrical Engineering", slug: "electrical-engineering", isFeatured: true },
      { degreeId: 2, name: "Software Engineering", slug: "software-engineering", isFeatured: true },
      { degreeId: 2, name: "Chemical Engineering", slug: "chemical-engineering", isFeatured: false },
      { degreeId: 2, name: "Computer Engineering", slug: "computer-engineering", isFeatured: false },
      { degreeId: 11, name: "Engineering Management", slug: "engineering-management", isFeatured: false },
      { degreeId: 11, name: "Structural Engineering", slug: "structural-engineering", isFeatured: false },

      // Medical Programs
      { degreeId: 4, name: "MBBS", slug: "mbbs", isFeatured: true },
      { degreeId: 4, name: "BDS", slug: "bds", isFeatured: true },
      { degreeId: 4, name: "Pharm-D", slug: "pharm-d", isFeatured: false },
      { degreeId: 1, name: "BS Nursing", slug: "bs-nursing", isFeatured: false },
      { degreeId: 1, name: "BS Medical Technology", slug: "bs-medical-tech", isFeatured: false },
      { degreeId: 10, name: "MS Public Health", slug: "ms-public-health", isFeatured: false },

      // Business Programs
      { degreeId: 3, name: "BBA", slug: "bba", isFeatured: true },
      { degreeId: 9, name: "MBA", slug: "mba", isFeatured: true },
      { degreeId: 1, name: "BS Accounting", slug: "bs-accounting", isFeatured: false },
      { degreeId: 1, name: "BS Economics", slug: "bs-economics", isFeatured: false },
      { degreeId: 10, name: "MS Finance", slug: "ms-finance", isFeatured: false },

      // IT Programs
      { degreeId: 1, name: "BS Computer Science", slug: "bs-computer-science", isFeatured: true },
      { degreeId: 1, name: "BS Information Technology", slug: "bs-information-technology", isFeatured: true },
      { degreeId: 10, name: "MS Data Science", slug: "ms-data-science", isFeatured: true },
      { degreeId: 10, name: "MS Artificial Intelligence", slug: "ms-ai", isFeatured: true },
      { degreeId: 1, name: "BS Cyber Security", slug: "bs-cyber-security", isFeatured: false },
      { degreeId: 12, name: "PhD Computer Science", slug: "phd-cs", isFeatured: false },

      // Law Programs
      { degreeId: 5, name: "LLB (5-Year)", slug: "llb-5-year", isFeatured: true },
      { degreeId: 5, name: "LLB (3-Year)", slug: "llb-3-year", isFeatured: false },
      { degreeId: 8, name: "LLM", slug: "llm", isFeatured: false },

      // Education Programs
      { degreeId: 6, name: "B.Ed", slug: "bed", isFeatured: true },
      { degreeId: 8, name: "M.Ed", slug: "med", isFeatured: true },
      { degreeId: 1, name: "BS Education", slug: "bs-education", isFeatured: false },

      // Arts Programs
      { degreeId: 7, name: "BA", slug: "ba", isFeatured: true },
      { degreeId: 8, name: "MA English", slug: "ma-english", isFeatured: true },
      { degreeId: 8, name: "MA History", slug: "ma-history", isFeatured: false },
      { degreeId: 1, name: "BS Psychology", slug: "bs-psychology", isFeatured: true },
      { degreeId: 1, name: "BS Sociology", slug: "bs-sociology", isFeatured: false },
      { degreeId: 1, name: "BS Mass Communication", slug: "bs-mass-comm", isFeatured: false },
    ];

    for (const prog of programValues) {
      await db.insert(programs).values({
        id: programId++,
        ...prog,
        status: true
      });
    }
    console.log(`✅ ${programValues.length} Programs created`);

    /* =========================
       10. PROGRAM-INSTITUTE RELATIONS
       ========================= */
    console.log("Creating program-institute relations...");
    const allPrograms = await db.select().from(programs);
    const allInstitutes = await db.select().from(institutes);

    let relationCount = 0;
    for (const program of allPrograms) {
      // Randomly select 3-5 institutes for each program
      const shuffled = [...allInstitutes].sort(() => 0.5 - Math.random());
      const selectedInstitutes = shuffled.slice(0, Math.floor(Math.random() * 3) + 3);
      
      for (const institute of selectedInstitutes) {
        await db.insert(programInstitutes).values({
          programId: program.id,
          instituteId: institute.id,
          status: true
        }).catch(() => {});
        relationCount++;
      }
    }
    console.log(`✅ ${relationCount} Program-Institute relations created`);

    /* =========================
       11. PROGRAM-CITY RELATIONS
       ========================= */
    console.log("Creating program-city relations...");
    const allCities = await db.select().from(cities);
    const popularCities = allCities.filter(c => c.isPopular);
    const otherCities = allCities.filter(c => !c.isPopular);

    let cityRelationCount = 0;
    for (const program of allPrograms) {
      // Link to all popular cities
      for (const city of popularCities) {
        await db.insert(programCities).values({
          programId: program.id,
          cityId: city.id
        }).catch(() => {});
        cityRelationCount++;
      }
      
      // Link to 2 random other cities
      const shuffled = [...otherCities].sort(() => 0.5 - Math.random());
      const selectedCities = shuffled.slice(0, 2);
      
      for (const city of selectedCities) {
        await db.insert(programCities).values({
          programId: program.id,
          cityId: city.id
        }).catch(() => {});
        cityRelationCount++;
      }
    }
    console.log(`✅ ${cityRelationCount} Program-City relations created`);

    /* =========================
       12. ADMISSIONS
       ========================= */
    console.log("Creating admissions...");
    const currentYear = new Date().getFullYear();
    let admissionCount = 0;
    
    for (let i = 0; i < 10; i++) {
      const randomProgram = allPrograms[Math.floor(Math.random() * allPrograms.length)];
      const randomInstitute = allInstitutes[Math.floor(Math.random() * allInstitutes.length)];
      
      await db.insert(admissions).values({
        programId: randomProgram.id,
        instituteId: randomInstitute.id,
        year: currentYear,
        session: "Fall",
        status: "Open",
        expectedCloseDate: new Date(currentYear, 8, 30),
        officialLink: "https://www.example.edu/admissions",
      }).catch(() => {});
      admissionCount++;
    }
    console.log(`✅ ${admissionCount} Admissions created`);

    /* =========================
       📊 SUMMARY
       ========================= */
    const finalCategories = await db.select().from(categories);
    const finalPrograms = await db.select().from(programs);
    const finalInstitutes = await db.select().from(institutes);
    const finalCities = await db.select().from(cities);
    const finalRelations = await db.select().from(programInstitutes);
    const finalCityRelations = await db.select().from(programCities);

    console.log("\n✅✅✅ Seed Completed Successfully! ✅✅✅");
    console.log("📊 Final Summary:");
    console.log(`- Categories: ${finalCategories.length}`);
    console.log(`- Programs: ${finalPrograms.length}`);
    console.log(`- Institutes: ${finalInstitutes.length}`);
    console.log(`- Cities: ${finalCities.length}`);
    console.log(`- Program-Institute Relations: ${finalRelations.length}`);
    console.log(`- Program-City Relations: ${finalCityRelations.length}`);

  } catch (error) {
    console.error("❌ Error during seed:", error);
  }
}

seed().catch(console.error);