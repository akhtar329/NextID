// app/lib/seed.ts
import { db } from '@/db/db';
import { adminUsers, adminRoles } from '@/db/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seedAdmin() {

  try {
    let roleId = 1;
    
    const existingRole = await db
      .select()
      .from(adminRoles)
      .where(eq(adminRoles.id, 1))
      .limit(1);

    if (existingRole.length === 0) {
      const [newRole] = await db
        .insert(adminRoles)
        .values({
          id: 1,
          name: 'SuperAdmin',
          description: 'Full system access',
          status: true,
        })
        .returning();
      roleId = newRole.id;
    } else {
      roleId = existingRole[0].id;
    }

    // 2. Hash password
    const password = 'Akhtar123';
    const hashedPassword = await hash(password, 10);
    
    const existingUser = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, 'pervezakhtar329@gmail.com'))
      .limit(1);

    let result;
    
    if (existingUser.length === 0) {
      // Create new user
      result = await db
        .insert(adminUsers)
        .values({
          name: 'Pervez Akhtar',
          email: 'pervezakhtar329@gmail.com',
          password: hashedPassword,
          roleId: roleId,
          status: true,
        })
        .returning();
    } else {
      // Update existing user
      result = await db
        .update(adminUsers)
        .set({
          name: 'Pervez Akhtar',
          password: hashedPassword,
          roleId: roleId,
          status: true,
          updatedAt: new Date(),
        })
        .where(eq(adminUsers.email, 'pervezakhtar329@gmail.com'))
        .returning();
    }

  } catch (error) {
    console.error('❌ Seed error:', error);
    console.error('Details:', error instanceof Error ? error.message : error);
  }
}

// Run seed
seedAdmin()
  .catch(console.error)
  .finally(() => process.exit(0));