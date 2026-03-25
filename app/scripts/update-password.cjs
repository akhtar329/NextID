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
        process.exit(1);
    }
    
    try {
        await client.connect();
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const result = await client.query(
            `UPDATE admin_users 
             SET password = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING id, name, email`,
            [hashedPassword, userId]
        );
        
        if (result.rows.length > 0) {
        } else {
        }
        
        await client.end();
    } catch (error) {
        console.error('✗ Error:', error.message);
        await client.end();
    }
}

updatePassword();