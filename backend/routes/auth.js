import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'iiit_pune_campus_connect_super_secret_key';

// GET profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        contactNumber: true,
        userId: true,
        responder: {
          select: {
            id: true,
            role: true,
            availabilityStatus: true,
            currentWorkload: true,
            rating: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Register new student account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Strict institutional student email validation pattern: <MIS>@ece.iiitp.ac.in or <MIS>@cse.iiitp.ac.in
    const emailRegex = /^(\d+)@(ece|cse)\.iiitp\.ac\.in$/i;
    const match = trimmedEmail.match(emailRegex);

    if (!match) {
      return res.status(400).json({
        error: 'Invalid institutional email format! Must be <MIS>@cse.iiitp.ac.in or <MIS>@ece.iiitp.ac.in (e.g. 112415079@cse.iiitp.ac.in)'
      });
    }

    const mis = match[1];

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this institutional email already exists. Please sign in.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: trimmedEmail,
        name: name.trim(),
        passwordHash,
        role: 'STUDENT',
        contactNumber: contactNumber || '+91 9988776655',
        userId: mis,
      },
    });

    console.log(`[BACKEND LOG] New Student Registered: ${newUser.name} (${newUser.email}) - MIS: ${newUser.userId}`);

    const io = req.app.get('io');
    if (io) {
      io.emit('user_created', {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        userId: newUser.userId,
        createdAt: newUser.createdAt,
      });
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        contactNumber: newUser.contactNumber,
        userId: newUser.userId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST standard login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { responder: true },
    });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        contactNumber: user.contactNumber,
        userId: user.userId,
        responder: user.responder,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST quick login (demo helper)
router.post('/quick-login', async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    // Find the first user in the database with this role
    let user;
    if (role === 'RESPONDER') {
      // Find the first responder's user details
      user = await prisma.user.findFirst({
        where: { role: 'RESPONDER' },
        include: { responder: true },
      });
    } else {
      user = await prisma.user.findFirst({
        where: { role },
        include: { responder: true },
      });
    }

    if (!user) {
      return res.status(404).json({ error: `No seed user found for role ${role}` });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        contactNumber: user.contactNumber,
        userId: user.userId,
        responder: user.responder,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET list of all registered users (for Admin Directory)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        contactNumber: true,
        userId: true,
        createdAt: true,
        department: true,
        section: true,
        hostelBlock: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Admin endpoint to create a user with any role directly
router.post('/admin-create-user', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Administrators can create users via this console.' });
    }

    const { name, email, password, role, contactNumber, userId, department, section, hostelBlock } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check existing
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const generatedUserId = userId || (Math.floor(100000000 + Math.random() * 900000000)).toString();

    const createdUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        role: role.toUpperCase(),
        contactNumber: contactNumber || '+91 9988776655',
        userId: generatedUserId,
        department: department || 'Computer Science & Engineering',
        section: section || 'Section A (CSE)',
        hostelBlock: hostelBlock || 'Vindhyachal BH-1',
      },
    });

    console.log(`[BACKEND LOG] New User Created via Frontend Console: ${createdUser.name} (${createdUser.email}) - Role: ${createdUser.role}`);

    // Emit Socket.IO event to all connected admin clients
    const io = req.app.get('io');
    if (io) {
      io.emit('user_created', {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        userId: createdUser.userId,
        createdAt: createdUser.createdAt,
      });
    }

    res.status(201).json({
      message: 'User account created successfully in database!',
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        userId: createdUser.userId,
        contactNumber: createdUser.contactNumber,
        department: createdUser.department,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
