const bcrypt = require('bcryptjs');

const password = 'Akhtar123';
const storedHash = '$2b$10$x8DmaQWfB/QRt4CN6fp1n.5ZyP8oIX9evy.eZ3eM1qWspCNvMMNEO';

bcrypt.compare(password, storedHash, (err, result) => {
    if (err) {
        console.error('Error:', err);
    } else {
        if (result) {
        } else {
        }
    }
});