
// app/api/super-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/app/lib/db"; // aapka Drizzle ORM instance
import { adminUsers } from "@/app/lib/schema"; // Drizzle schema table

export async function POST(req: NextRequest) {
  try {
    // aap password yahan hardcode kar rahe ho
    const hashedPassword = await hash("@2662982", 10);

    const result = await db.insert(adminUsers).values([
      {
        name: "Pervez Akhtar",
        email: "admin@nextid.pk",
        password: hashedPassword,
        roleId: 1,   // super admin ka role
        status: true,
      },
    ]);

    return NextResponse.json({ message: "Super admin created", result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create super admin" }, { status: 500 });
  }
}