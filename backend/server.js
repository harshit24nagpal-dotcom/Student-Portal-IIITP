import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routers
import authRouter from './routes/auth.js';
import emergenciesRouter from './routes/emergencies.js';
import respondersRouter from './routes/responders.js';
import locationsRouter from './routes/locations.js';
import contactsRouter from './routes/contacts.js';
import analyticsRouter from './routes/analytics.js';
import attendanceRouter from './routes/attendance.js';
import registrationRouter from './routes/registration.js';
import noduesRouter from './routes/nodues.js';
import filesRouter from './routes/files.js';
import notificationsRouter from './routes/notifications.js';

// Import background services
import { startEscalationService } from './services/escalation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(
  cors({
    origin: '*', // For development, allow any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

app.use(express.json());

// Serve static uploaded files (PDFs, images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Expose Socket.IO instance on app to use in route handlers
app.set('io', io);

// Register API Routes
app.use('/api/auth', authRouter);
app.use('/api/emergencies', emergenciesRouter);
app.use('/api/responders', respondersRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/registration', registrationRouter);
app.use('/api/nodues', noduesRouter);
app.use('/api/files', filesRouter);
app.use('/api/notifications', notificationsRouter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'IIIT Pune Campus Connect', time: new Date() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);

  // Register user to roles/rooms for directed notifications
  socket.on('join_room', (data) => {
    const { userId, role } = data;
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`[SOCKET] Socket ${socket.id} joined room user_${userId}`);
    }
    if (role) {
      socket.join(`role_${role}`);
      console.log(`[SOCKET] Socket ${socket.id} joined room role_${role}`);
      if (role === 'ADMIN' || role === 'SECURITY') {
        socket.join('dispatch_staff');
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] User disconnected: ${socket.id}`);
  });
});

// Start Background Services
startEscalationService(io);

// Serve static frontend in production
const frontendDist = path.join(__dirname, '../frontend/dist');
if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true') {
  app.use(express.static(frontendDist));

  // SPA Catch-all: serve index.html for non-API/non-upload GET requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Start listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  IIIT Pune Campus Connect Backend Service`);
  console.log(`  Listening on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log(`==================================================\n`);
});
