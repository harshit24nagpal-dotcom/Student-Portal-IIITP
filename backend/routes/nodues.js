import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to emit socket notifications
const notifyUser = (req, userId, title, message, type = 'INFO', category = 'NO_DUES') => {
  const io = req.app.get('io');
  if (io) {
    io.emit('user_notification', { recipientId: userId, title, message, type, category });
  }
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

// 1. GET Current Student No-Dues Status & 15 Department Clearances
router.get('/my-status', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const application = await prisma.noDuesApplication.findUnique({
      where: { studentId },
      include: {
        clearances: {
          include: {
            department: true,
            officer: { select: { name: true, role: true, email: true } }
          },
          orderBy: { department: { displayOrder: 'asc' } }
        },
        documents: true,
        certificate: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    const departments = await prisma.noDuesDepartment.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      application: application || null,
      departments,
      isGraduatingEligible: req.user.isGraduating || req.user.batch === '2020-2024' || req.user.semester >= 8
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Apply for Graduating Batch No-Dues Clearance
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const existing = await prisma.noDuesApplication.findUnique({
      where: { studentId }
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted a No-Dues application.' });
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });

    // Create No-Dues application
    const application = await prisma.noDuesApplication.create({
      data: {
        studentId,
        batch: student.batch || '2020-2024',
        programme: student.programme || 'B.Tech Computer Science & Engineering',
        status: 'IN_PROGRESS',
        statusHistory: {
          create: {
            fromStatus: 'NOT_SUBMITTED',
            toStatus: 'IN_PROGRESS',
            changedBy: student.name,
            remarks: 'Initiated graduating batch no-dues clearance process.'
          }
        }
      }
    });

    // Create 15 Department clearance tracking items
    const departments = await prisma.noDuesDepartment.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    for (const dept of departments) {
      await prisma.noDuesClearance.create({
        data: {
          applicationId: application.id,
          departmentId: dept.id,
          status: 'PENDING',
          amountDue: 0
        }
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: studentId,
        action: 'NO_DUES_INITIATED',
        module: 'NO_DUES',
        details: `Student ${student.name} (${student.userId}) initiated No-Dues application`
      }
    });

    res.json({
      message: 'No-Dues clearance application initiated across all 15 IIIT Pune departments!',
      application
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET Clearance Officer Pending Applications for specific department or all
router.get('/officer/pending', authenticateToken, async (req, res) => {
  try {
    if (!['CLEARANCE_OFFICER', 'ADMIN', 'FACULTY', 'HOSTEL_WARDEN', 'SECURITY'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Authorized clearance officer role required.' });
    }

    const { departmentId } = req.query;

    let whereClause = {};
    if (departmentId) {
      whereClause.departmentId = parseInt(departmentId);
    }

    const clearances = await prisma.noDuesClearance.findMany({
      where: whereClause,
      include: {
        department: true,
        application: {
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
                batch: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(clearances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. POST Clearance Officer Action (Approve / Reject / Clarification)
router.post('/officer/action', authenticateToken, async (req, res) => {
  try {
    if (!['CLEARANCE_OFFICER', 'ADMIN', 'FACULTY', 'HOSTEL_WARDEN', 'SECURITY'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Clearance officer role required.' });
    }

    const { clearanceId, status, amountDue, remarks } = req.body;
    // status: "APPROVED" | "REJECTED" | "CLARIFICATION_REQUIRED"

    if (!clearanceId || !status) {
      return res.status(400).json({ error: 'clearanceId and status are required' });
    }

    const item = await prisma.noDuesClearance.findUnique({
      where: { id: clearanceId },
      include: {
        department: true,
        application: { include: { student: true } }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Clearance record not found' });
    }

    const updatedClearance = await prisma.noDuesClearance.update({
      where: { id: clearanceId },
      data: {
        status,
        officerId: req.user.id,
        amountDue: parseFloat(amountDue || 0),
        remarks: remarks || null,
        actionAt: new Date()
      }
    });

    // Check if ALL 15 departments have now APPROVED
    const allClearances = await prisma.noDuesClearance.findMany({
      where: { applicationId: item.applicationId }
    });

    const totalDepts = allClearances.length;
    const approvedCount = allClearances.filter(c => c.status === 'APPROVED').length;

    let cert = null;
    if (totalDepts > 0 && approvedCount === totalDepts) {
      // Auto-generate No-Dues Clearance Certificate!
      const certId = `IIITP-ND-${new Date().getFullYear()}-${String(item.application.id).padStart(4, '0')}`;
      const qrUrl = `http://localhost:5173/verify-certificate/${certId}`;

      cert = await prisma.noDuesCertificate.upsert({
        where: { applicationId: item.applicationId },
        update: {
          studentName: item.application.student.name,
          studentMIS: item.application.student.userId,
          programme: item.application.student.programme || 'B.Tech CSE',
          batch: item.application.batch,
          qrVerificationUrl: qrUrl,
          issuedAt: new Date()
        },
        create: {
          applicationId: item.applicationId,
          certificateId: certId,
          studentName: item.application.student.name,
          studentMIS: item.application.student.userId,
          programme: item.application.student.programme || 'B.Tech CSE',
          batch: item.application.batch,
          qrVerificationUrl: qrUrl,
        }
      });

      // Update application status to COMPLETED
      await prisma.noDuesApplication.update({
        where: { id: item.applicationId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      notifyUser(
        req,
        item.application.studentId,
        '🎓 No-Dues Clearance Certificate Issued!',
        `Congratulations! All 15 departments have approved your clearance. Your official No-Dues Certificate (${certId}) is ready for download.`,
        'INFO'
      );
    } else {
      notifyUser(
        req,
        item.application.studentId,
        `No-Dues Update: ${item.department.name}`,
        `Status: ${status}. ${amountDue > 0 ? `Outstanding amount due: ₹${amountDue}.` : ''} Remarks: ${remarks || 'None'}`,
        status === 'APPROVED' ? 'INFO' : 'ALERT'
      );
    }

    res.json({
      message: `Clearance status updated to ${status}`,
      clearance: updatedClearance,
      isFullyApproved: approvedCount === totalDepts,
      certificate: cert
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. GET Certificate Details (Public or Authenticated Verification)
router.get('/certificate/:certId', async (req, res) => {
  try {
    const { certId } = req.params;

    const cert = await prisma.noDuesCertificate.findFirst({
      where: {
        OR: [
          { certificateId: certId },
          { applicationId: parseInt(certId) || -1 }
        ]
      },
      include: {
        application: {
          include: {
            student: {
              select: { name: true, userId: true, email: true, programme: true, batch: true }
            },
            clearances: {
              include: {
                department: true,
                officer: { select: { name: true, role: true } }
              },
              orderBy: { department: { displayOrder: 'asc' } }
            }
          }
        }
      }
    });

    if (!cert) {
      return res.status(404).json({ error: 'No-Dues Certificate not found or invalid' });
    }

    res.json(cert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. GET Admin No-Dues System Overview & Directory
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const applications = await prisma.noDuesApplication.findMany({
      include: {
        student: {
          select: { id: true, name: true, email: true, userId: true, batch: true, programme: true }
        },
        clearances: {
          include: { department: true }
        },
        certificate: true,
        statusHistory: true
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
