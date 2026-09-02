import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all responders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const responders = await prisma.responder.findMany({
      include: {
        user: {
          select: { name: true, contactNumber: true, email: true, userId: true },
        },
        skills: true,
      },
    });
    res.json(responders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update availability status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['AVAILABLE', 'BUSY', 'OFFLINE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updated = await prisma.responder.update({
      where: { id: parseInt(req.params.id) },
      data: { availabilityStatus: status },
      include: {
        user: { select: { name: true } },
      },
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('responder_status_changed', {
        responderId: updated.id,
        status: updated.availabilityStatus,
        responderName: updated.user.name,
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update live location coordinates (simulates GPS tracker)
router.put('/:id/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const updated = await prisma.responder.update({
      where: { id: parseInt(req.params.id) },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      include: {
        user: { select: { name: true } },
      },
    });

    // Broadcast live coordinates
    const io = req.app.get('io');
    if (io) {
      io.emit('responder_location_updated', {
        responderId: updated.id,
        latitude: updated.latitude,
        longitude: updated.longitude,
        responderName: updated.user.name,
      });
    }

    res.json({ success: true, responder: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET responder performance
router.get('/:id/performance', authenticateToken, async (req, res) => {
  try {
    const responder = await prisma.responder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!responder) {
      return res.status(404).json({ error: 'Responder not found' });
    }

    // Average Response Time in minutes
    const avgResponseTimeSec = responder.resolvedCount > 0 
      ? Math.round(responder.responseTimeSum / responder.resolvedCount) 
      : 0;
    const avgResponseTimeMin = Math.round((avgResponseTimeSec / 60) * 10) / 10;

    res.json({
      responderId: responder.id,
      name: responder.user.name,
      resolvedCount: responder.resolvedCount,
      avgResponseTimeSeconds: avgResponseTimeSec,
      avgResponseTimeMinutes: avgResponseTimeMin,
      rating: responder.rating,
      status: responder.availabilityStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
