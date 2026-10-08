// Removes the demo/seed records the old version of this CRM inserted automatically.
// Real Meta lead IDs are numeric, so every lead whose metaLeadId starts with "meta_" is demo/simulated data.
// Usage:
//   npm run remove-demo-data            -> preview only (nothing is deleted)
//   npm run remove-demo-data -- --confirm   -> delete
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Lead = require('../models/Lead');

const DEMO_EMAILS = ['admin@crm.com', 'sarah.jenkins@crm.com', 'marcus.vance@crm.com', 'elena.rodriguez@crm.com'];
const DEMO_LEAD_QUERY = { metaLeadId: { $regex: '^meta_' } };

const run = async () => {
  const confirm = process.argv.includes('--confirm');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const demoUsers = await User.find({ email: { $in: DEMO_EMAILS } }).select('name email role');
  const demoLeadCount = await Lead.countDocuments(DEMO_LEAD_QUERY);
  const realAdmins = await User.countDocuments({ role: 'admin', status: 'active', email: { $nin: DEMO_EMAILS } });

  console.log(`Demo users found: ${demoUsers.length}`);
  demoUsers.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
  console.log(`Demo/simulated leads found: ${demoLeadCount}`);

  if (!confirm) {
    console.log('\nPreview only. Run again with --confirm to delete these records.');
  } else if (realAdmins === 0 && demoUsers.some((u) => u.role === 'admin')) {
    console.log('\nStopped: create your own admin first (npm run create-admin), otherwise nobody could log in.');
  } else {
    const ids = demoUsers.map((u) => u._id);
    const leads = await Lead.deleteMany(DEMO_LEAD_QUERY);
    // Unassign real leads that were assigned to demo users
    const unassigned = await Lead.updateMany({ assignedTo: { $in: ids } }, { $set: { assignedTo: null } });
    const users = await User.deleteMany({ _id: { $in: ids } });
    console.log(`\nDeleted ${leads.deletedCount} demo lead(s) and ${users.deletedCount} demo user(s). ` +
      `${unassigned.modifiedCount} remaining lead(s) were unassigned.`);
  }
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
