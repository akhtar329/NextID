const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function updatePassword() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'corex',
        user: 'postgres',
        password: '', // Add your PostgreSQL password if any
    });
    
    const userId = process.argv[2] || 6;
    const newPassword = process.argv[3];
    
    if (!newPassword) {
        console.log('Usage: node update-password.cjs [user_id] [new_password]');
        console.log('Example: node update-password.cjs 6 Akhtar123');
        process.exit(1);
    }
    
    try {
        await client.connect();
        console.log('✓ Connected to database');
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const result = await client.query(
            `UPDATE admin_users 
             SET password = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING id, name, email`,
            [hashedPassword, userId]
        );
        
        if (result.rows.length > 0) {
            console.log('\n✓ Password updated successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`User ID: ${result.rows[0].id}`);
            console.log(`Name: ${result.rows[0].name}`);
            console.log(`Email: ${result.rows[0].email}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } else {
            console.log(`✗ User with ID ${userId} not found`);
        }
        
        await client.end();
    } catch (error) {
        console.error('✗ Error:', error.message);
        await client.end();
    }
}

updatePassword();