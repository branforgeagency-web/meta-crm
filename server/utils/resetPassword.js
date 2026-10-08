// Resets a CRM user's password (and re-activates the account).
// Usage: npm run reset-password -- email@yourdomain.com "NewStrongPassword"
// With no arguments, lists all users so you can find the right email.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  const [email, password] = process.argv.slice(2);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  if (!email) {
    const users = await User.find().select('name email role status');
    console.table(users.map((u) => ({ name: u.name, email: u.email, role: u.role, status: u.status })));
    console.log('Usage: npm run reset-password -- email@yourdomain.com "NewStrongPassword"');
    return mongoose.disconnect();
  }
  if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw new Error(`No user found with email ${email}`);
  user.password = password; // hashed by the model's pre-save hook
  user.status = 'active';
  await user.save();
  console.log(`Password reset for ${user.email} (${user.role}). You can now log in.`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
