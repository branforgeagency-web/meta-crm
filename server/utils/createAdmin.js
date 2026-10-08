// Creates a real administrator account.
// Usage: npm run create-admin -- "Full Name" email@yourdomain.com "StrongPassword"
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.log('Usage: npm run create-admin -- "Full Name" email@yourdomain.com "StrongPassword"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    console.error(`A user with email ${email} already exists.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  await User.create({ name, email: email.toLowerCase(), password, role: 'admin', status: 'active' });
  console.log(`Admin account created for ${email}. You can now log in.`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Failed to create admin:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
