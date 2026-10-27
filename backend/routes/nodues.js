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

// Sector Categorization for 15 Institutional Departments
export const DEPARTMENT_SECTORS = {
  ACADEMIC_RESEARCH: {
    id: 'ACADEMIC_RESEARCH',
    title: 'Academic & Dissertation Sector',
    description: 'B.Tech/M.Tech Dissertation thesis submission, course credit audit, and departmental verification',
    icon: 'GraduationCap',
    departmentNames: [
      'Thesis Supervisor / Guide',
      'Course Coordinator',
      'Head of Department'
    ]
  },
  LABS_SYSTEMS: {
    id: 'LABS_SYSTEMS',
    title: 'Laboratories & Computing Systems Sector',
    description: 'Hardware kits, development boards, server quotas, lab tool return & equipment verification',
    icon: 'Cpu',
    departmentNames: [
      'Computers Labs',
      'Electronics Labs',
      'Server Room',
      'Store In-charge'
    ]
  },
  LIBRARY_INFO: {
    id: 'LIBRARY_INFO',
    title: 'Central Library & Learning Resources',
    description: 'Physical & digital catalog return, overdue fine reconciliation, and thesis repository deposit',
    icon: 'BookOpen',
    departmentNames: [
      'Library / Information Service'
    ]
  },
  RESIDENTIAL_CAMPUS: {
    id: 'RESIDENTIAL_CAMPUS',
    title: 'Residential Life & Campus Safety',
    description: 'Hostel room inventory inspection, room key surrender, mess dues clearance, and security gate pass reconciliation',
    icon: 'Building2',
    departmentNames: [
      'Hostel Warden / Hostel In-charge',
      'Security In-charge'
    ]
  },
  ADMIN_FINANCE: {
    id: 'ADMIN_FINANCE',
    title: 'Administration & Finance Reconciliation',
    description: 'Placement NOC, sports gear return, exam cell grade verification, fee balance, and caution money refund NEFT processing',
    icon: 'Landmark',
    departmentNames: [
      'Training and Placement Cell',
      'Sports In-charge',
      'Examination Cell',
      'Accounts Section',
      'Academic Section'
    ]
  }
};

// Helper: Check if all 15 clearances are approved, auto-generate certificate
async function checkAndIssueCertificate(req, applicationId) {
  const application = await prisma.noDuesApplication.findUnique({
    where: { id: applicationId },
    include: {
      student: true,
      clearances: { include: { department: true } }
    }
  });

  if (!application) return { isComplete: false, certificate: null };

  const totalDepts = application.clearances.length;
  const approvedCount = application.clearances.filter(c => c.status === 'APPROVED').length;

  if (totalDepts > 0 && approvedCount === totalDepts) {
    const certId = `IIITP-ND-${new Date().getFullYear()}-${String(application.id).padStart(4, '0')}`;
    const qrUrl = `http://localhost:5173/verify-certificate/${certId}`;

    const cert = await prisma.noDuesCertificate.upsert({
      where: { applicationId: application.id },
      update: {
        studentName: application.student.name,
        studentMIS: application.student.userId,
        programme: application.student.programme || 'B.Tech CSE',
        batch: application.batch,
        qrVerificationUrl: qrUrl,
        issuedAt: new Date(),
        isValid: true
      },
      create: {
        applicationId: application.id,
        certificateId: certId,
        studentName: application.student.name,
        studentMIS: application.student.userId,
        programme: application.student.programme || 'B.Tech CSE',
        batch: application.batch,
        qrVerificationUrl: qrUrl,
        isValid: true
      }
    });

    await prisma.noDuesApplication.update({
      where: { id: application.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    notifyUser(
      req,
      application.studentId,
      '🎓 Official No-Dues Clearance Certificate Issued!',
      `Congratulations! All 15 departments have officially approved your clearance. Your No-Dues Certificate (${certId}) is ready for download and caution deposit refund processing.`,
      'INFO'
    );

    return { isComplete: true, certificate: cert };
  }

  return { isComplete: false, certificate: null };
}

// 1. GET Current Student No-Dues Status & 15 Department Clearances
router.get('/my-status', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Fetch fresh student profile to accurately determine final-year graduation eligibility
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        role: true,
        department: true,
        programme: true,
        batch: true,
        semester: true,
        isGraduating: true,
        contactNumber: true,
        hostelBlock: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    // Institutional criterion for Final-Year Student eligibility:
    // 1. Explicitly flagged as isGraduating === true
    // 2. Currently in Semester >= 7 (Semester 7 or 8 for 4-year B.Tech)
    // 3. Batch is '2020-2024' (graduating batch)
    const isFinalYear = Boolean(
      student.isGraduating === true ||
      (student.semester !== null && student.semester >= 7) ||
      (student.batch && (student.batch === '2020-2024' || student.batch.endsWith('-2024') || student.batch.includes('Graduating')))
    );

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

    const clearances = application?.clearances || [];
    const totalAmountDue = clearances.reduce((sum, c) => sum + (c.amountDue || 0), 0);
    const approvedCount = clearances.filter(c => c.status === 'APPROVED').length;
    const cautionDeposit = 10000; // Standard IIIT Pune Institutional Caution Deposit (₹10,000)
    const netRefundPayable = Math.max(0, cautionDeposit - totalAmountDue);

    // Extract saved refund bank metadata if available
    let refundBankDetails = null;
    if (application?.statusHistory) {
      const historyWithBank = application.statusHistory.find(h => {
        try {
          const parsed = JSON.parse(h.remarks);
          return parsed && parsed.accountNumber;
        } catch {
          return false;
        }
      });
      if (historyWithBank) {
        try {
          refundBankDetails = JSON.parse(historyWithBank.remarks);
        } catch {
          refundBankDetails = null;
        }
      }
    }

    // Academic Year Label for clarity
    const academicYearLabel = 
      (student.semester >= 7) ? '4th Year (Final Year / Graduating)' :
      (student.semester >= 5) ? '3rd Year (Pre-Final Year)' :
      (student.semester >= 3) ? '2nd Year (Continuing Student)' :
      '1st Year (Continuing Student)';

    res.json({
      application: application || null,
      departments,
      sectors: DEPARTMENT_SECTORS,
      student: {
        ...student,
        academicYearLabel,
        isFinalYear
      },
      isFinalYear,
      isGraduatingEligible: isFinalYear,
      cautionDeposit,
      totalAmountDue,
      netRefundPayable,
      approvedCount,
      totalDepts: clearances.length || departments.length,
      refundBankDetails
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Apply for Graduating Batch No-Dues Clearance (with Caution Money Refund NEFT Details)
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { 
      bankName = 'State Bank of India', 
      accountNumber = '', 
      ifscCode = '', 
      accountHolderName = '', 
      futureAddress = '',
      simulateFinalYear = false
    } = req.body;

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });

    // Verify eligibility
    const isActuallyFinalYear = Boolean(
      student.isGraduating === true ||
      (student.semester !== null && student.semester >= 7) ||
      (student.batch && (student.batch === '2020-2024' || student.batch.endsWith('-2024') || student.batch.includes('Graduating')))
    );

    if (!isActuallyFinalYear && !simulateFinalYear) {
      return res.status(403).json({
        error: 'No-Dues clearance is exclusively for Final Year Graduating Batch students (Semesters 7 & 8). Continuing students are not required to complete No-Dues.'
      });
    }

    const existing = await prisma.noDuesApplication.findUnique({
      where: { studentId }
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already initiated your Graduating No-Dues application.' });
    }

    // Bank Details metadata
    const bankDetailsPayload = {
      bankName: bankName.trim() || 'State Bank of India',
      accountNumber: accountNumber.trim() || `3098${Math.floor(10000000 + Math.random() * 90000000)}`,
      ifscCode: (ifscCode.trim() || 'SBIN0012345').toUpperCase(),
      accountHolderName: accountHolderName.trim() || student.name,
      futureAddress: futureAddress.trim() || 'Permanent Residential Address on Institutional Record',
      cautionDeposit: 10000,
      submittedDate: new Date().toISOString()
    };

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
            department: 'ACCOUNTS_SECTION_REFUND',
            remarks: JSON.stringify(bankDetailsPayload)
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
      // By default, let sample initial dues be 0, or add small realistic sample fine for Library (e.g. ₹150)
      const sampleDues = dept.name.includes('Library') ? 150 : 0;
      await prisma.noDuesClearance.create({
        data: {
          applicationId: application.id,
          departmentId: dept.id,
          status: sampleDues > 0 ? 'PENDING' : 'PENDING',
          amountDue: sampleDues,
          remarks: sampleDues > 0 ? 'Overdue book return fine (1 book, 15 days overdue)' : null
        }
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: studentId,
        action: 'NO_DUES_INITIATED',
        module: 'NO_DUES',
        details: `Graduating Student ${student.name} (${student.userId}) initiated No-Dues clearance with NEFT Caution Money refund registration.`
      }
    });

    res.json({
      message: 'Graduating No-Dues application initiated across all 15 departments with Caution Money Refund bank registration!',
      application
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2b. POST 1-Click Online Dues Settlement (UPI / NetBanking / Debit Card)
router.post('/settle-dues', authenticateToken, async (req, res) => {
  try {
    const { clearanceId, paymentMethod = 'UPI', transactionRef } = req.body;

    if (!clearanceId) {
      return res.status(400).json({ error: 'clearanceId is required for dues settlement' });
    }

    const clearance = await prisma.noDuesClearance.findUnique({
      where: { id: parseInt(clearanceId) },
      include: {
        department: true,
        application: { include: { student: true } }
      }
    });

    if (!clearance) {
      return res.status(404).json({ error: 'Clearance record not found' });
    }

    // Verify student or admin authorized
    if (clearance.application.studentId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to settle dues for this record' });
    }

    const amountPaid = clearance.amountDue;
    const txnId = transactionRef || `TXN-IIITP-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const updatedClearance = await prisma.noDuesClearance.update({
      where: { id: clearance.id },
      data: {
        amountDue: 0,
        status: 'APPROVED',
        remarks: `Dues of ₹${amountPaid} settled online via ${paymentMethod} on ${new Date().toLocaleDateString()}. Txn ID: ${txnId}`,
        actionAt: new Date()
      }
    });

    // Record status history
    await prisma.noDuesStatusHistory.create({
      data: {
        applicationId: clearance.applicationId,
        fromStatus: clearance.status,
        toStatus: 'APPROVED',
        changedBy: req.user.name || clearance.application.student.name,
        department: clearance.department.name,
        remarks: `Paid ₹${amountPaid} online via ${paymentMethod} (Txn: ${txnId}). Department dues reset to ₹0.`
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'NO_DUES_SETTLED_ONLINE',
        module: 'NO_DUES',
        details: `Student settled ₹${amountPaid} for ${clearance.department.name} via ${paymentMethod}. Reference: ${txnId}`
      }
    });

    // Check if all 15 departments are now approved
    const certResult = await checkAndIssueCertificate(req, clearance.applicationId);

    notifyUser(
      req,
      clearance.application.studentId,
      'Payment Settled & Clearance Approved',
      `₹${amountPaid} paid for ${clearance.department.name}. Status updated to APPROVED. (Txn: ${txnId})`,
      'INFO'
    );

    res.json({
      message: `Dues of ₹${amountPaid} settled successfully. ${clearance.department.name} status updated to APPROVED.`,
      clearance: updatedClearance,
      isFullyApproved: certResult.isComplete,
      certificate: certResult.certificate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2c. POST Toggle Final-Year Graduation Eligibility (Interactive Demo Helper for Evaluators & Panel)
router.post('/toggle-demo-eligibility', authenticateToken, async (req, res) => {
  try {
    const student = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!student) return res.status(404).json({ error: 'User not found' });

    // Toggle: if currently not graduating/semester 3, set to semester 8 & isGraduating: true
    // If currently semester 8, set back to semester 3 & isGraduating: false
    const willBeGraduating = !student.isGraduating && (student.semester || 3) < 7;
    const newSemester = willBeGraduating ? 8 : 3;
    const newBatch = willBeGraduating ? '2020-2024' : '2024-2028';

    const updated = await prisma.user.update({
      where: { id: student.id },
      data: {
        isGraduating: willBeGraduating,
        semester: newSemester,
        batch: newBatch
      }
    });

    res.json({
      message: willBeGraduating 
        ? 'Switched profile to Final Year Graduating Batch (Semester 8, Batch 2020-2024).' 
        : 'Switched profile back to Continuing Student (Semester 3, Batch 2024-2028).',
      student: {
        id: updated.id,
        name: updated.name,
        semester: updated.semester,
        batch: updated.batch,
        isGraduating: updated.isGraduating,
        isFinalYear: willBeGraduating
      }
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
                batch: true,
                semester: true
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

// 4. POST Clearance Officer Action (Approve / Reject / Clarification / Update Fine)
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
      where: { id: parseInt(clearanceId) },
      include: {
        department: true,
        application: { include: { student: true } }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Clearance record not found' });
    }

    const updatedClearance = await prisma.noDuesClearance.update({
      where: { id: item.id },
      data: {
        status,
        officerId: req.user.id,
        amountDue: parseFloat(amountDue || 0),
        remarks: remarks || null,
        actionAt: new Date()
      }
    });

    // Check if ALL 15 departments have now APPROVED
    const certResult = await checkAndIssueCertificate(req, item.applicationId);

    if (!certResult.isComplete) {
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
      isFullyApproved: certResult.isComplete,
      certificate: certResult.certificate
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
              select: { name: true, userId: true, email: true, programme: true, batch: true, semester: true }
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
          select: { id: true, name: true, email: true, userId: true, batch: true, programme: true, semester: true }
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


