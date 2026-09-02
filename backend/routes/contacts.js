import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all emergency contacts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const contacts = await prisma.emergencyContact.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add a contact (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, number, department } = req.body;
    if (!name || !number || !department) {
      return res.status(400).json({ error: 'Name, number and department are required' });
    }

    const contact = await prisma.emergencyContact.create({
      data: { name, number, department },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CONTACT_ADDED',
        details: `Emergency contact ${name} (${number}) added.`,
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a contact (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const contact = await prisma.emergencyContact.findUnique({ where: { id } });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await prisma.emergencyContact.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CONTACT_DELETED',
        details: `Emergency contact ${contact.name} deleted.`,
      },
    });

    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
