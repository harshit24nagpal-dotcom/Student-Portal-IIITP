import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET notifications for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Mark notification as read
router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET System Configurations (e.g., Warning thresholds)
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    const configMap = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });
    res.json(configMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Update System Config (Admin only)
router.post('/config', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { key, value, module } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'key and value are required' });
    }

    const updated = await prisma.systemConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), module: module || 'SYSTEM' }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
