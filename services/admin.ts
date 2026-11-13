
import { getDb } from "@/db/db";
import { adminUsers, adminRoles } from "@/db/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

export async function seedAdmin(): Promise<void> {
  try {
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    const name = process.env.SEED_ADMIN_NAME?.trim() || "Super Admin";

    if (!email || !password) {
      throw new Error(
        "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be configured"
      );
    }

    if (password.length < 12 || password.length > 128) {
      throw new Error("Seed admin password must be 12 to 128 characters");
    }

    const db = getDb();

    // Find or create Super Admin role
    const existingRole = await db
      .select()
      .from(adminRoles)
      .where(eq(adminRoles.id, 1))
      .limit(1);

    let roleId: number;

    if (existingRole.length === 0) {
      const [newRole] = await db
        .insert(adminRoles)
        .values({
          id: 1,
          name: "SuperAdmin",
          description: "Full system access",
          status: true,
        })
        .returning({ id: adminRoles.id });

      if (!newRole) {
        throw new Error("Could not create Super Admin role");
      }

      roleId = newRole.id;
    } else {
      roleId = existingRole[0].id;
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Find existing admin
    const existingUser = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      await db
        .insert(adminUsers)
        .values({
          name,
          email,
          password: hashedPassword,
          roleId,
          status: true,
        });
    } else {
      await db
        .update(adminUsers)
        .set({
          name,
          password: hashedPassword,
          roleId,
          status: true,
          updatedAt: new Date(),
        })
        .where(eq(adminUsers.email, email));
    }

    console.info("Admin seed completed successfully");
  } catch (error) {
    console.error(
      "Admin seed failed:",
      error instanceof Error ? error.message : error
    );

    throw error;
  }
}
