const bcrypt = require('bcryptjs');

const plainPassword = 'Akhtar123';
const storedHash = '$2b$10$x8DmaQWfB/QRt4CN6fp1n.5ZyP8oIX9evy.eZ3eM1qWspCNvMMNEO';

console.log('Verifying password...');
console.log('Email: pervezakhtar329@gmail.com');
console.log('Password entered: Akhtar123');
console.log('');

bcrypt.compare(plainPassword, storedHash, (err, result) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Password match result:', result);
        if (result) {
            console.log('✅ Password is CORRECT!');
            console.log('Login should work with:');
            console.log('  Email: pervezakhtar329@gmail.com');
            console.log('  Password: Akhtar123');
        } else {
            console.log('❌ Password is INCORRECT!');
        }
    }
});