require('dotenv').config();
const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', methods: ['GET', 'POST'] },
});

// Only logged-in, active CRM users may receive real-time lead data.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Not authorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name role status');
    if (!user || user.status !== 'active') return next(new Error('Not authorized'));
    socket.data.user = user;
    return next();
  } catch (err) {
    return next(new Error('Not authorized'));
  }
});

io.on('connection', (socket) => {
  socket.join('crm');
  console.log(`[Socket.io]: ${socket.data.user.name} connected (${socket.id})`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io]: ${socket.data.user.name} disconnected (${socket.id})`);
  });
});

// Controllers broadcast with req.app.get('socketio') -> only to authenticated sockets.
app.set('socketio', io.to('crm'));

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
// Keep the raw body so Meta webhook signatures (X-Hub-Signature-256) can be verified.
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date(), service: 'Meta Ads Lead Management CRM Backend' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/meta', require('./routes/metaRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('[Global Express Error]:', err.stack || err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5005;

// Run as a normal long-lived server locally / on a VPS.
// On Vercel, api/index.js imports `app` instead and this block is skipped.
if (require.main === module) {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log('=================================================');
      console.log(`Meta Lead CRM Server running on port ${PORT}`);
      console.log(`Webhook Endpoint: /api/meta/webhook`);
      console.log('=================================================');
    });
  });
}

module.exports = { app, server };
