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

// Edit an announcement (Admin, Faculty, Warden)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'HOSTEL_WARDEN', 'FACULTY', 'FACULTY_ADVISOR'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, portalType, category, priority, badgeText } = req.body;

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Announcement not found' });

    // Master Admin can edit any announcement; others can edit their own role's announcements
    if (req.user.role !== 'ADMIN' && existing.authorRole !== req.user.role) {
      return res.status(403).json({ error: 'Unauthorized to edit this announcement' });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: title || existing.title,
        content: content || existing.content,
        portalType: portalType ? portalType.toUpperCase() : existing.portalType,
        category: category ? category.toUpperCase() : existing.category,
        priority: priority ? priority.toUpperCase() : existing.priority,
        badgeText: badgeText !== undefined ? badgeText : existing.badgeText
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('announcement_event', { type: 'UPDATED_ANNOUNCEMENT', data: updated });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update Announcement Error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete an announcement (Admin or original author role)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'HOSTEL_WARDEN', 'FACULTY', 'FACULTY_ADVISOR'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Announcement not found' });

    if (req.user.role !== 'ADMIN' && existing.authorRole !== req.user.role) {
      return res.status(403).json({ error: 'Unauthorized to delete this announcement' });
    }

    await prisma.announcement.delete({ where: { id } });

    const io = req.app.get('io');
    if (io) {
      io.emit('announcement_event', { type: 'DELETED_ANNOUNCEMENT', id });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete Announcement Error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
