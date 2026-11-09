// Usage: node scripts/hash-password.mjs "MyNewPassword"
// Prints a bcrypt hash. Paste it into phpMyAdmin: users table -> your admin row -> password_hash
import bcrypt from 'bcryptjs';
const pw = process.argv[2];
if (!pw || pw.length < 8) { console.error('Give a password of at least 8 characters'); process.exit(1); }
console.log(bcrypt.hashSync(pw, 10));
