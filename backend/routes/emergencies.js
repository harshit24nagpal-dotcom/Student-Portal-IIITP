import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { rankResponders } from '../services/assignment.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all active emergencies (unresolved)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const active = await prisma.emergencyRequest.findMany({
      where: {
        status: { not: 'RESOLVED' },
      },
      include: {
        reporter: {
          select: { name: true, contactNumber: true, email: true },
        },
        assignments: {
          include: {
            responder: {
              include: { user: { select: { name: true, contactNumber: true } } },
            },
          },
        },
        statusHistory: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(active);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET emergency history (resolved)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.emergencyRequest.findMany({
      where: {
        status: 'RESOLVED',
      },
      include: {
        reporter: {
          select: { name: true, contactNumber: true },
        },
        assignments: {
          include: {
            responder: {
              include: { user: { select: { name: true, contactNumber: true } } },
            },
          },
        },
      },
      orderBy: { resolvedAt: 'desc' },
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single emergency details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id: req.params.id },
      include: {
        reporter: {
          select: { name: true, contactNumber: true, email: true, userId: true },
        },
        assignments: {
          include: {
            responder: {
              include: {
                user: { select: { name: true, contactNumber: true } },
                skills: true,
              },
            },
          },
        },
        statusHistory: {
          include: {
            changedBy: { select: { name: true, role: true } },
          },
          orderBy: { timestamp: 'asc' },
        },
        locationHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    // Also send ranked responders if not yet assigned
    let recommendations = [];
    if (emergency.status === 'REPORTED') {
      const responders = await prisma.responder.findMany({
        include: {
          user: { select: { name: true, contactNumber: true } },
          skills: true,
        },
      });
      recommendations = rankResponders(emergency.type, emergency.latitude, emergency.longitude, responders);
    }

    res.json({ emergency, recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST trigger new SOS
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, latitude, longitude, manualLocation, description } = req.body;

    if (!type || !latitude || !longitude) {
      return res.status(400).json({ error: 'Type, latitude and longitude are required' });
    }

    // Generate unique ID
    const count = await prisma.emergencyRequest.count();
    const emergencyId = `IIITP-EM-${String(count + 1).padStart(3, '0')}`;

    // Get reporter user info
    const reporter = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Create Emergency Request
    const emergency = await prisma.emergencyRequest.create({
      data: {
        id: emergencyId,
        reporterId: reporter.id,
        reporterName: reporter.name,
        reporterContact: reporter.contactNumber,
        type,
        severity: 'CRITICAL',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        manualLocation,
        description,
        status: 'REPORTED',
        escalationLevel: 0,
      },
    });

    // Create initial status history entry
    await prisma.emergencyStatusHistory.create({
      data: {
        requestId: emergency.id,
        status: 'REPORTED',
        changedById: reporter.id,
        note: 'Emergency triggered by student SOS button.',
      },
    });

    // Auto-recommend responders
    const responders = await prisma.responder.findMany({
      include: {
        user: { select: { name: true, contactNumber: true } },
        skills: true,
      },
    });
    const recommendations = rankResponders(type, latitude, longitude, responders);
    const bestResponder = recommendations[0];

    // Auto-assign the best responder if they are available
    let assignedResponderId = null;
    let updatedEmergency = emergency;

    if (bestResponder && bestResponder.availabilityStatus === 'AVAILABLE') {
      assignedResponderId = bestResponder.id;
      
      // Update status to RESPONDER_ASSIGNED
      updatedEmergency = await prisma.emergencyRequest.update({
        where: { id: emergency.id },
        data: { status: 'RESPONDER_ASSIGNED' },
      });

      // Create Assignment
      await prisma.emergencyAssignment.create({
        data: {
          requestId: emergency.id,
          responderId: bestResponder.id,
          status: 'PENDING',
        },
      });

      // Create status history entry
      await prisma.emergencyStatusHistory.create({
        data: {
          requestId: emergency.id,
          status: 'RESPONDER_ASSIGNED',
          changedById: 3, // System admin/auto
          note: `System auto-assigned top-ranked responder: ${bestResponder.user.name} (${bestResponder.role}) with recommendation score: ${bestResponder.score}`,
        },
      });

      // Notify the responder in DB
      await prisma.notification.create({
        data: {
          recipientId: bestResponder.userId,
          title: `🚨 EMERGENCY ASSIGNED: ${emergency.id}`,
          message: `You have been assigned to a ${type} emergency at ${manualLocation || 'GPS location'}.`,
          type: 'CRITICAL',
        },
      });
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: reporter.id,
        action: 'SOS_TRIGGERED',
        details: `Emergency ${emergency.id} of type ${type} triggered.`,
      },
    });

    // WebSocket Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('new_emergency', {
        emergency: {
          ...updatedEmergency,
          reporter: { name: reporter.name, contactNumber: reporter.contactNumber },
        },
        recommendations,
        assignedResponderId,
      });
    }

    res.status(201).json({
      emergency: updatedEmergency,
      recommendations,
      assignedResponderId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST manual override / assign responder
router.post('/:id/assign', authenticateToken, async (req, res) => {
  try {
    const { responderId } = req.body;
    const requestId = req.params.id;

    if (!responderId) {
      return res.status(400).json({ error: 'responderId is required' });
    }

    const responder = await prisma.responder.findUnique({
      where: { id: parseInt(responderId) },
      include: { user: true },
    });

    if (!responder) {
      return res.status(404).json({ error: 'Responder not found' });
    }

    // Cancel any existing pending assignments
    await prisma.emergencyAssignment.updateMany({
      where: { requestId, status: 'PENDING' },
      data: { status: 'DECLINED' },
    });

    // Create new assignment
    const assignment = await prisma.emergencyAssignment.create({
      data: {
        requestId,
        responderId: responder.id,
        status: 'PENDING',
      },
    });

    // Update request status
    const updatedRequest = await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: { status: 'RESPONDER_ASSIGNED' },
    });

    // Record history
    await prisma.emergencyStatusHistory.create({
      data: {
        requestId,
        status: 'RESPONDER_ASSIGNED',
        changedById: req.user.id,
        note: `Admin manually assigned responder: ${responder.user.name} (${responder.role})`,
      },
    });

    // Notify responder
    await prisma.notification.create({
      data: {
        recipientId: responder.userId,
        title: `🚨 EMERGENCY ASSIGNED: ${requestId}`,
        message: `Admin manually assigned you to emergency ${requestId}.`,
        type: 'CRITICAL',
      },
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_updated', {
        requestId,
        status: 'RESPONDER_ASSIGNED',
        request: updatedRequest,
        assignment,
      });
    }

    res.json({ success: true, assignment, request: updatedRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST responder accept assignment
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { responder: true },
    });

    if (!user.responder) {
      return res.status(400).json({ error: 'User is not a responder' });
    }

    // Update Assignment
    const assignment = await prisma.emergencyAssignment.findFirst({
      where: { requestId, responderId: user.responder.id, status: 'PENDING' },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'No pending assignment found' });
    }

    await prisma.emergencyAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });

    // Update Request
    const updatedRequest = await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: { status: 'RESPONDER_EN_ROUTE' },
    });

    // Update Responder Workload
    await prisma.responder.update({
      where: { id: user.responder.id },
      data: {
        availabilityStatus: 'BUSY',
        currentWorkload: { increment: 1 },
      },
    });

    // Record history
    await prisma.emergencyStatusHistory.create({
      data: {
        requestId,
        status: 'RESPONDER_EN_ROUTE',
        changedById: req.user.id,
        note: `Responder accepted assignment and is en route.`,
      },
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_updated', {
        requestId,
        status: 'RESPONDER_EN_ROUTE',
        request: updatedRequest,
      });
    }

    res.json({ success: true, request: updatedRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST responder decline assignment
router.post('/:id/decline', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { responder: true },
    });

    if (!user.responder) {
      return res.status(400).json({ error: 'User is not a responder' });
    }

    const assignment = await prisma.emergencyAssignment.findFirst({
      where: { requestId, responderId: user.responder.id, status: 'PENDING' },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'No pending assignment found' });
    }

    // Update Assignment
    await prisma.emergencyAssignment.update({
      where: { id: assignment.id },
      data: { status: 'DECLINED' },
    });

    // Put request back to REPORTED status
    const updatedRequest = await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: { status: 'REPORTED' },
    });

    // Record history
    await prisma.emergencyStatusHistory.create({
      data: {
        requestId,
        status: 'REPORTED',
        changedById: req.user.id,
        note: `Responder declined assignment. Returned to queue.`,
      },
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_updated', {
        requestId,
        status: 'REPORTED',
        request: updatedRequest,
      });
    }

    res.json({ success: true, request: updatedRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST responder arrived
router.post('/:id/arrive', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    
    // Update Request
    const updatedRequest = await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: { status: 'RESPONDER_ARRIVED' },
    });

    // Record history
    await prisma.emergencyStatusHistory.create({
      data: {
        requestId,
        status: 'RESPONDER_ARRIVED',
        changedById: req.user.id,
        note: `Responder arrived at emergency scene.`,
      },
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_updated', {
        requestId,
        status: 'RESPONDER_ARRIVED',
        request: updatedRequest,
      });
    }

    res.json({ success: true, request: updatedRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST resolve emergency
router.post('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { notes } = req.body;
    const now = new Date();

    // Find active assignment
    const activeAssignment = await prisma.emergencyAssignment.findFirst({
      where: { requestId, status: 'ACCEPTED' },
      include: { responder: true },
    });

    // Update Request
    const updatedRequest = await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: {
        status: 'RESOLVED',
        resolvedAt: now,
        notes: notes || 'Resolved by emergency personnel.',
      },
    });

    // Record status history
    await prisma.emergencyStatusHistory.create({
      data: {
        requestId,
        status: 'RESOLVED',
        changedById: req.user.id,
        note: `Emergency marked RESOLVED. Notes: ${notes || 'None'}`,
      },
    });

    // Update responder stats if applicable
    if (activeAssignment) {
      const assignedAt = new Date(activeAssignment.assignedAt);
      const elapsedSeconds = Math.floor((now.getTime() - assignedAt.getTime()) / 1000);

      await prisma.responder.update({
        where: { id: activeAssignment.responderId },
        data: {
          currentWorkload: { decrement: 1 },
          availabilityStatus: 'AVAILABLE',
          resolvedCount: { increment: 1 },
          responseTimeSum: { increment: elapsedSeconds },
        },
      });
    }

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_updated', {
        requestId,
        status: 'RESOLVED',
        request: updatedRequest,
      });
    }

    res.json({ success: true, request: updatedRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST cancel accidental request
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.id;

    // Find request
    const request = await prisma.emergencyRequest.findUnique({
      where: { id: requestId },
      include: { assignments: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Allow cancel only if not resolved
    if (request.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Emergency already resolved' });
    }

    // Mark RESOLVED with note
    const updatedRequest = await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        notes: 'Cancelled by reporter (Accidental Trigger).',
      },
    });

    // Record status history
    await prisma.emergencyStatusHistory.create({
      data: {
        requestId,
        status: 'RESOLVED',
        changedById: req.user.id,
        note: `Emergency cancelled by reporter (accidental trigger).`,
      },
    });

    // Free up responders
    const activeAssignment = await prisma.emergencyAssignment.findFirst({
      where: { requestId, status: 'ACCEPTED' },
    });

    if (activeAssignment) {
      await prisma.responder.update({
        where: { id: activeAssignment.responderId },
        data: {
          currentWorkload: { decrement: 1 },
          availabilityStatus: 'AVAILABLE',
        },
      });
    }

    // Decline pending assignments
    await prisma.emergencyAssignment.updateMany({
      where: { requestId, status: 'PENDING' },
      data: { status: 'DECLINED' },
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_updated', {
        requestId,
        status: 'RESOLVED',
        request: updatedRequest,
      });
    }

    res.json({ success: true, request: updatedRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
