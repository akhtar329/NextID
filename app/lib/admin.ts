// app/lib/seed.ts
import { db } from './db.ts';
import { adminUsers, adminRoles } from './schema.ts';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seedAdmin() {
  console.log('🌱 Starting admin seed...\n');

  try {
    // 1. Create SuperAdmin role if not exists
    console.log('🔵 Checking admin role...');
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
      console.log('✅ SuperAdmin role created');
    } else {
      roleId = existingRole[0].id;
      console.log('✅ SuperAdmin role already exists');
    }

    // 2. Hash password
    console.log('🔵 Hashing password...');
    const password = 'Akhtar123';
    const hashedPassword = await hash(password, 10);
    console.log('✅ Password hashed');

    // 3. Create or update admin user
    console.log('🔵 Creating/updating admin user...');
    
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
      console.log('✅ New admin user created!');
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
      console.log('✅ Existing admin user updated!');
    }

    // 4. Show credentials
    console.log('\n📋 Login Credentials:');
    console.log('   Email: pervezakhtar329@gmail.com');
    console.log('   Password: Akhtar123');
    console.log(`   Role: SuperAdmin`);
    console.log(`   Status: Active`);
    console.log('\n🎉 Admin seed completed successfully!');

  } catch (error) {
    console.error('❌ Seed error:', error);
    console.error('Details:', error instanceof Error ? error.message : error);
  }
}

// Run seed
seedAdmin()
  .catch(console.error)
  .finally(() => process.exit(0));