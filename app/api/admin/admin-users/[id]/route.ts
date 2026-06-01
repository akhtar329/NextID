import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const user = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, Number(id)));

  if (!user.length) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    user: user[0],
  });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();

  await db
    .update(adminUsers)
    .set({
      name: body.name,
      email: body.email,
      roleId: body.roleId,
      status: body.status,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, Number(id)));

  return NextResponse.json({
    success: true,
    message: "User updated successfully",
  });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await db
    .delete(adminUsers)
    .where(eq(adminUsers.id, Number(id)));

  return NextResponse.json({
    success: true,
    message: "User deleted successfully",
  });
}
