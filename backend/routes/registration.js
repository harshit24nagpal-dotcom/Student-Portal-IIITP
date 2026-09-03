import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to emit socket notifications
const notifyUser = (req, userId, title, message, type = 'INFO', category = 'REGISTRATION') => {
  const io = req.app.get('io');
  if (io) {
    io.emit('user_notification', { recipientId: userId, title, message, type, category });
  }
  // Also persist notification in DB
  prisma.notification.create({
    data: {
      recipientId: userId,
      title,
      message,
      type,
      category
    }
  }).catch(err => console.error('Notification save error:', err));
};

// 1. GET Current Student Registration Status & Timeline History
router.get('/my-status', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find active semester
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true }
    });

    if (!activeSemester) {
      return res.status(404).json({ error: 'No active semester registration open currently.' });
    }

    let registration = await prisma.semesterRegistration.findFirst({
      where: {
        studentId,
        semesterId: activeSemester.id,
      },
      include: {
        semester: true,
        documents: {
          orderBy: { uploadedAt: 'desc' }
        },
        verifications: {
          include: { verifier: { select: { name: true, role: true, email: true } } },
          orderBy: { timestamp: 'desc' }
        },
        statusHistory: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    res.json({
      activeSemester,
      registration: registration || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Submit or Resubmit Semester Registration Documents
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { documents } = req.body; // Array of { documentType, documentName, filePath, fileType, fileSize }

    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'At least one document (ERP Proof or Fee Receipt) must be uploaded' });
    }

    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true }
    });

    if (!activeSemester) {
      return res.status(400).json({ error: 'Semester registration is currently closed.' });
    }

    // Check existing registration
    let registration = await prisma.semesterRegistration.findFirst({
      where: { studentId, semesterId: activeSemester.id }
    });

    if (!registration) {
      // Create new registration
      registration = await prisma.semesterRegistration.create({
        data: {
          studentId,
          semesterId: activeSemester.id,
          status: 'WARDEN_REVIEW',
          documents: {
            create: documents.map(d => ({
              documentType: d.documentType,
              documentName: d.documentName,
              filePath: d.filePath,
              fileType: d.fileType || 'pdf',
              fileSize: d.fileSize || 1024,
              status: 'PENDING'
            }))
          },
          statusHistory: {
            create: {
              fromStatus: 'NOT_SUBMITTED',
              toStatus: 'WARDEN_REVIEW',
              changedBy: req.user.name,
              remarks: 'Semester registration submitted by student.'
            }
          }
        },
        include: { documents: true }
      });
    } else {
      // Update existing registration (Resubmission case)
      const prevStatus = registration.status;

      // Add/Replace documents
      for (const d of documents) {
        await prisma.registrationDocument.create({
          data: {
            registrationId: registration.id,
            documentType: d.documentType,
            documentName: d.documentName,
            filePath: d.filePath,
            fileType: d.fileType || 'pdf',
            fileSize: d.fileSize || 1024,
            status: 'PENDING'
          }
        });
      }

      registration = await prisma.semesterRegistration.update({
        where: { id: registration.id },
        data: {
          status: 'WARDEN_REVIEW',
          statusHistory: {
            create: {
              fromStatus: prevStatus,
              toStatus: 'WARDEN_REVIEW',
              changedBy: req.user.name,
              remarks: 'Resubmitted registration documents for verification.'
            }
          }
        },
        include: { documents: true }
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: studentId,
        action: 'REGISTRATION_SUBMITTED',
        module: 'REGISTRATION',
        details: `Student submitted registration documents for Semester ID ${activeSemester.id}`
      }
    });

    res.json({
      message: 'Semester registration documents submitted successfully! Pending Hostel Warden verification.',
      registration
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET Hostel Warden Pending Verifications
router.get('/warden/pending', authenticateToken, async (req, res) => {
  try {
    if (!['HOSTEL_WARDEN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Hostel Warden role required.' });
    }

    const registrations = await prisma.semesterRegistration.findMany({
      where: {
        status: { in: ['WARDEN_REVIEW', 'PENDING'] }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
            contactNumber: true,
            department: true,
            programme: true,
            section: true,
            hostelBlock: true
          }
        },
        semester: true,
        documents: true,
        verifications: true
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. POST Hostel Warden Action (Approve / Reject / Resubmit)
router.post('/warden/verify', authenticateToken, async (req, res) => {
  try {
    if (!['HOSTEL_WARDEN', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Hostel Warden role required.' });
    }

    const { registrationId, action, remarks } = req.body; // action: "APPROVED" | "REJECTED" | "RESUBMISSION_REQUIRED"

    if (!registrationId || !action) {
      return res.status(400).json({ error: 'registrationId and action are required' });
    }

    const reg = await prisma.semesterRegistration.findUnique({
      where: { id: registrationId },
      include: { student: true }
    });

    if (!reg) {
      return res.status(404).json({ error: 'Registration record not found' });
    }

    let nextStatus = 'WARDEN_APPROVED';
    if (action === 'REJECTED') nextStatus = 'REJECTED';
    if (action === 'RESUBMISSION_REQUIRED') nextStatus = 'RESUBMISSION_REQUIRED';

    // Record verification log
    await prisma.registrationVerification.create({
      data: {
        registrationId,
        verifierId: req.user.id,
        verifierRole: 'HOSTEL_WARDEN',
        action,
        remarks: remarks || null
      }
    });

    // Record status history
    await prisma.registrationStatusHistory.create({
      data: {
        registrationId,
        fromStatus: reg.status,
        toStatus: nextStatus,
        changedBy: `${req.user.name} (Hostel Warden)`,
        remarks: remarks || `Hostel verification marked ${action}`
      }
    });

    // Update registration state
    const updated = await prisma.semesterRegistration.update({
      where: { id: registrationId },
      data: {
        status: nextStatus,
        wardenRemarks: remarks || null
      }
    });

    // Send notification to student
    notifyUser(
      req,
      reg.studentId,
      `Hostel Verification ${action}`,
      action === 'APPROVED' 
        ? 'Your hostel clearance has been verified by the Warden and forwarded to your Faculty Advisor.'
        : `Hostel Warden action: ${action}. Remarks: ${remarks || 'None'}`,
      action === 'APPROVED' ? 'INFO' : 'ALERT'
    );

    res.json({ message: `Hostel verification recorded as ${action}`, registration: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. GET Faculty Advisor Pending Verifications
router.get('/advisor/pending', authenticateToken, async (req, res) => {
  try {
    if (!['FACULTY_ADVISOR', 'FACULTY', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Faculty Advisor role required.' });
    }

    const registrations = await prisma.semesterRegistration.findMany({
      where: {
        status: { in: ['WARDEN_APPROVED', 'ADVISOR_REVIEW'] }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
            contactNumber: true,
            department: true,
            programme: true,
            section: true,
            hostelBlock: true
          }
        },
        semester: true,
        documents: true,
        verifications: true
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. POST Faculty Advisor Action (Final Approval / Reject / Resubmit)
router.post('/advisor/verify', authenticateToken, async (req, res) => {
  try {
    if (!['FACULTY_ADVISOR', 'FACULTY', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Faculty Advisor role required.' });
    }

    const { registrationId, action, remarks } = req.body; // action: "APPROVED" | "REJECTED" | "RESUBMISSION_REQUIRED"

    if (!registrationId || !action) {
      return res.status(400).json({ error: 'registrationId and action are required' });
    }

    const reg = await prisma.semesterRegistration.findUnique({
      where: { id: registrationId },
      include: { student: true }
    });

    if (!reg) {
      return res.status(404).json({ error: 'Registration record not found' });
    }

    let nextStatus = 'APPROVED';
    if (action === 'REJECTED') nextStatus = 'REJECTED';
    if (action === 'RESUBMISSION_REQUIRED') nextStatus = 'RESUBMISSION_REQUIRED';

    // Record verification log
    await prisma.registrationVerification.create({
      data: {
        registrationId,
        verifierId: req.user.id,
        verifierRole: 'FACULTY_ADVISOR',
        action,
        remarks: remarks || null
      }
    });

    // Record status history
    await prisma.registrationStatusHistory.create({
      data: {
        registrationId,
        fromStatus: reg.status,
        toStatus: nextStatus,
        changedBy: `${req.user.name} (Faculty Advisor)`,
        remarks: remarks || `Faculty Advisor verification marked ${action}`
      }
    });

    // Update registration status
    const updated = await prisma.semesterRegistration.update({
      where: { id: registrationId },
      data: {
        status: nextStatus,
        advisorRemarks: remarks || null
      }
    });

    // Notify student
    notifyUser(
      req,
      reg.studentId,
      `Semester Registration ${nextStatus}`,
      nextStatus === 'APPROVED'
        ? 'Congratulations! Your Semester Registration has been fully approved by your Faculty Advisor.'
        : `Faculty Advisor action: ${action}. Remarks: ${remarks || 'None'}`,
      nextStatus === 'APPROVED' ? 'INFO' : 'ALERT'
    );

    res.json({ message: `Semester registration finalized as ${nextStatus}`, registration: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. GET Admin Registration Directory & Overview
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const registrations = await prisma.semesterRegistration.findMany({
      include: {
        student: {
          select: { id: true, name: true, email: true, userId: true, section: true, department: true }
        },
        semester: true,
        documents: true,
        verifications: {
          include: { verifier: { select: { name: true, role: true } } }
        },
        statusHistory: true
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
