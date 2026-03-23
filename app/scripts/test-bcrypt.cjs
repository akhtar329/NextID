const bcrypt = require('bcryptjs');

const password = 'Akhtar123';
const storedHash = '$2b$10$x8DmaQWfB/QRt4CN6fp1n.5ZyP8oIX9evy.eZ3eM1qWspCNvMMNEO';

console.log('Testing bcrypt compare...');
console.log('Password:', password);
console.log('Hash:', storedHash);
console.log('');

bcrypt.compare(password, storedHash, (err, result) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Result:', result);
        if (result) {
            console.log('✅ Password matches!');
        } else {
            console.log('❌ Password does NOT match!');
        }
    }
});