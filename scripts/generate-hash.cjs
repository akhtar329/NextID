const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
    process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
});