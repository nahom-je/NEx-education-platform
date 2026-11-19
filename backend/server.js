const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Load env vars
dotenv.config();

// App setup
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOriginValidator = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (
    allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.onrender.com') ||
    origin.includes('localhost')
  ) {
    return callback(null, true);
  }
  // Allow permissive in development/staging
  return callback(null, true);
};

const io = new Server(server, {
  cors: {
    origin: corsOriginValidator,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available in route handlers via req.app.get('io')
app.set('io', io);

// Routes
const authRoutes         = require('./routes/auth');
const resourceRoutes     = require('./routes/resources');
const adminRoutes        = require('./routes/admin');
const categoryRoutes     = require('./routes/categories');
const browseRoutes       = require('./routes/browse');
const quizRoutes         = require('./routes/quizzes');
const aiRoutes           = require('./routes/ai');
const settingsRoutes     = require('./routes/settings');
const paymentsRoutes     = require('./routes/payments');
const adminPaymentsRoutes = require('./routes/adminPayments');

// Middleware
app.use(cors({ origin: corsOriginValidator, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth',           authRoutes);
app.use('/api/resources',      resourceRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/categories',     categoryRoutes);
app.use('/api/browse',         browseRoutes);
app.use('/api/quizzes',        quizRoutes);
app.use('/api/ai',             aiRoutes);
app.use('/api/settings',       settingsRoutes);
app.use('/api/payments',       paymentsRoutes);
app.use('/api/admin/payments', adminPaymentsRoutes);

// Database Connection (Supabase is the primary production DB; MongoDB is optional legacy)
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('localhost')) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.warn('⚠️ MongoDB connection skipped (Supabase is active):', err.message));
} else {
  console.log('⚡ Primary database: Supabase (PostgreSQL) is active. MongoDB not required.');
}

// Basic Route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to NEx API V1' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Student joins their personal room for real-time updates
  socket.on('join:student', (studentId) => {
    socket.join(`student-${studentId}`);
    console.log(`Student ${studentId} joined their room`);
  });

  // Admin joins the admin room for new payment notifications
  socket.on('join:admin', () => {
    socket.join('admin-room');
    console.log(`Admin joined admin-room`);
  });

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });

  socket.on('sendMessage', (data) => {
    io.to(data.roomId).emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
