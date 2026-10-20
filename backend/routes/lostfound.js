import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all lost & found items with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, category, status, search } = req.query;
    const where = {};

    if (type) where.type = type.toUpperCase();
    if (category && category !== 'ALL') where.category = category.toUpperCase();
    if (status && status !== 'ALL') where.status = status.toUpperCase();

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } }
      ];
    }

    const items = await prisma.lostAndFoundItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reportedBy: {
          select: { id: true, name: true, userId: true, email: true, contactNumber: true }
        },
        claimedBy: {
          select: { id: true, name: true, userId: true, contactNumber: true }
        }
      }
    });

    res.json(items);
  } catch (error) {
    console.error('Lost & Found list error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Report a lost or found item
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, title, category, description, location, date, contactInfo, image } = req.body;
    if (!type || !title || !description || !location) {
      return res.status(400).json({ error: 'Type, title, description, and location are required' });
    }

    const item = await prisma.lostAndFoundItem.create({
      data: {
        type: type.toUpperCase(), // "LOST" or "FOUND"
        title,
        category: (category || 'OTHER').toUpperCase(),
        description,
        location,
        date: date || new Date().toISOString().split('T')[0],
        contactInfo: contactInfo || req.user.contactNumber || req.user.email,
        reportedById: req.user.id,
        image: image || null,
        status: 'OPEN'
      },
      include: {
        reportedBy: {
          select: { id: true, name: true, userId: true }
        }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('lost_found_event', { type: 'ITEM_REPORTED', data: item });
    }

    res.status(201).json(item);
  } catch (error) {
    console.error('Report Lost & Found Error:', error);
    res.status(500).json({ error: 'Failed to report item' });
  }
});

// Claim an item
router.put('/:id/claim', authenticateToken, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { claimNotes } = req.body;

    const item = await prisma.lostAndFoundItem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const updated = await prisma.lostAndFoundItem.update({
      where: { id: itemId },
      data: {
        status: 'CLAIMED',
        claimedById: req.user.id,
        claimedAt: new Date(),
        claimNotes: claimNotes || `Claim submitted by ${req.user.name} (${req.user.userId})`
      },
      include: {
        claimedBy: { select: { id: true, name: true, userId: true, contactNumber: true } }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('lost_found_event', { type: 'ITEM_CLAIMED', data: updated });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record claim' });
  }
});

// Resolve item (mark returned)
router.put('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = await prisma.lostAndFoundItem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const updated = await prisma.lostAndFoundItem.update({
      where: { id: itemId },
      data: {
        status: 'RESOLVED'
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('lost_found_event', { type: 'ITEM_RESOLVED', data: updated });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve item' });
  }
});

export default router;
