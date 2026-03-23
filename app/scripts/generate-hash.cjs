const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
    console.log('Usage: node generate-hash.cjs "your_password"');
    console.log('Example: node generate-hash.cjs "Akhtar123"');
    process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Password Hash:');
    console.log(hash);
    console.log('\nSQL Command to update:');
    console.log(`UPDATE admin_users SET password = '${hash}', updated_at = NOW() WHERE id = 6;`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});