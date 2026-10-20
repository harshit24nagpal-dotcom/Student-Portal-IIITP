import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Submit a new complaint / grievance
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category, subject, description, isAnonymous } = req.body;
    if (!category || !subject || !description) {
      return res.status(400).json({ error: 'Category, subject, and description are required' });
    }

    const complaint = await prisma.complaint.create({
      data: {
        studentId: req.user.id,
        category: category.toUpperCase(),
        subject,
        description,
        isAnonymous: Boolean(isAnonymous),
        status: 'PENDING'
      },
      include: {
        student: {
          select: { id: true, name: true, userId: true, department: true }
        }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_event', { type: 'COMPLAINT_SUBMITTED', data: complaint });
    }

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Complaint submission error:', error);
    res.status(500).json({ error: 'Failed to record complaint' });
  }
});

// Get student's own complaints
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { studentId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch personal complaints' });
  }
});

// Admin / Warden view all complaints
router.get('/all', authenticateToken, authorizeRoles('ADMIN', 'HOSTEL_WARDEN', 'SECURITY'), async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { id: true, name: true, userId: true, department: true, contactNumber: true }
        }
      }
    });

    // Mask student info if isAnonymous is true
    const sanitized = complaints.map(c => {
      if (c.isAnonymous) {
        return {
          ...c,
          student: {
            id: null,
            name: 'Anonymous Student (Identity Protected)',
            userId: 'CONFIDENTIAL',
            department: c.student?.department || 'Confidential'
          }
        };
      }
      return c;
    });

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Admin / Warden update complaint status & resolution
router.put('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'HOSTEL_WARDEN'), async (req, res) => {
  try {
    const complaintId = parseInt(req.params.id);
    const { status, adminRemarks } = req.body;

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: status || 'RESOLVED',
        adminRemarks: adminRemarks || 'Complaint evaluated and resolution applied.',
        resolvedAt: status === 'RESOLVED' ? new Date() : null
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_event', { type: 'COMPLAINT_UPDATED', data: updated });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

export default router;
