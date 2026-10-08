// Vercel serverless entry: serves every /api/* request through the Express app.
const mongoose = require('mongoose');
const { app } = require('../server/server');

let conn = null;
const connect = () => {
  if (!conn) {
    conn = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        conn = null;
        throw err;
      });
  }
  return conn;
};

module.exports = async (req, res) => {
  try {
    await connect();
  } catch (err) {
    console.error('[MongoDB Error]:', err.message);
    return res.status(503).json({ success: false, message: 'Database unavailable' });
  }
  return app(req, res);
};
