import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all campus locations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const locations = await prisma.campusLocation.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add a campus location (Admin/Security only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, latitude, longitude, type } = req.body;
    if (!name || latitude === undefined || longitude === undefined || !type) {
      return res.status(400).json({ error: 'Name, latitude, longitude and type are required' });
    }

    const newLoc = await prisma.campusLocation.create({
      data: {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        type,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CAMPUS_LOCATION_ADDED',
        details: `Campus Location ${name} (${type}) added at [${latitude}, ${longitude}].`,
      },
    });

    res.status(201).json(newLoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
