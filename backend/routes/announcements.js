import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get announcements with optional portalType filter ('ACADEMIC', 'HOSTEL', 'COMMON')
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { portalType } = req.query;
    const where = {};
    if (portalType && portalType !== 'ALL') {
      where.OR = [
        { portalType: portalType.toUpperCase() },
        { portalType: 'COMMON' }
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(announcements);
  } catch (error) {
    console.error('Fetch Announcements Error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Post an announcement (Authorized staff only)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'HOSTEL_WARDEN', 'FACULTY', 'FACULTY_ADVISOR', 'SECURITY', 'CLEARANCE_OFFICER'), async (req, res) => {
  try {
    const { title, content, portalType, category, priority, badgeText } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const item = await prisma.announcement.create({
      data: {
        title,
        content,
        portalType: (portalType || 'COMMON').toUpperCase(),
        category: (category || 'GENERAL').toUpperCase(),
        priority: (priority || 'NORMAL').toUpperCase(),
        badgeText: badgeText || null,
        date: new Date().toISOString().split('T')[0],
        authorRole: req.user.role || 'ADMINISTRATION'
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('announcement_event', { type: 'NEW_ANNOUNCEMENT', data: item });
    }

    res.status(201).json(item);
  } catch (error) {
    console.error('Create Announcement Error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

export default router;
