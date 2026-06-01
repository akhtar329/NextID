import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { adminUsers, adminRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const users = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      roleId: adminUsers.roleId,
      roleName: adminRoles.name,
      status: adminUsers.status,
    })
    .from(adminUsers)
    .leftJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id));

  return NextResponse.json({
    success: true,
    users,
  });
}
