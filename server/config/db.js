const mongoose = require('mongoose');

// Connects to the real MongoDB database configured in MONGODB_URI.
// No in-memory fallback and no auto-seeding: if the database is unreachable the server stops,
// so data is never silently written to a throwaway database.
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('[MongoDB]: MONGODB_URI is not set in server/.env');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error]: Could not connect to database (${error.message})`);
    process.exit(1);
  }
};

module.exports = connectDB;
