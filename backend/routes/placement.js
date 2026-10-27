import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REQUESTS_FILE = path.join(__dirname, '..', 'data', 'placement_requests.json');

function getPlacementRequests() {
  try {
    if (fs.existsSync(REQUESTS_FILE)) {
      return JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading placement requests:', err);
  }
  return [];
}

function savePlacementRequests(data) {
  try {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing placement requests:', err);
  }
}

// ============================================================================
// 1. STUDENT PLACEMENT DRIVES (Student & TPO)
// ============================================================================

// Get placement drives with smart eligibility evaluation for logged-in student
router.get('/drives', authenticateToken, async (req, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, userId: true, department: true, cgpa: true, activeBacklogs: true, batch: true }
    });

    const drives = await prisma.placementDrive.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        applications: {
          where: { studentId: req.user.id }
        }
      }
    });

    const studentCgpa = student?.cgpa ?? 8.45;
    const studentBacklogs = student?.activeBacklogs ?? 0;
    const studentBranch = student?.department || 'CSE';

    // Enhance each drive with student-specific eligibility criteria
    const enhancedDrives = drives.map(drive => {
      const isCgpaEligible = studentCgpa >= drive.minCgpa;
      const isBacklogEligible = studentBacklogs <= drive.maxBacklogs;
      const branchesList = drive.allowedBranches.split(',').map(b => b.trim().toUpperCase());
      const isBranchEligible = branchesList.includes(studentBranch.toUpperCase()) || drive.allowedBranches === 'ALL';

      const isEligible = isCgpaEligible && isBacklogEligible && isBranchEligible;

      const ineligibilityReasons = [];
      if (!isCgpaEligible) ineligibilityReasons.push(`Requires Min CGPA ${drive.minCgpa} (Your CGPA: ${studentCgpa})`);
      if (!isBacklogEligible) ineligibilityReasons.push(`No active backlogs permitted (You have ${studentBacklogs})`);
      if (!isBranchEligible) ineligibilityReasons.push(`Eligible branches: ${drive.allowedBranches} (Your Branch: ${studentBranch})`);

      const myApp = drive.applications[0] || null;

      return {
        ...drive,
        isEligible,
        ineligibilityReasons,
        hasApplied: Boolean(myApp),
        applicationStatus: myApp?.status || null,
        interviewSlot: myApp?.interviewSlot || null,
        interviewLink: myApp?.interviewLink || null
      };
    });

    res.json({
      studentStats: {
        cgpa: studentCgpa,
        activeBacklogs: studentBacklogs,
        branch: studentBranch,
        batch: student?.batch || '2024-2028'
      },
      drives: enhancedDrives
    });
  } catch (error) {
    console.error('Fetch Drives Error:', error);
    res.status(500).json({ error: 'Failed to fetch placement drives' });
  }
});

// Student applies to a drive
router.post('/apply/:driveId', authenticateToken, async (req, res) => {
  try {
    const driveId = parseInt(req.params.driveId);
    const drive = await prisma.placementDrive.findUnique({ where: { id: driveId } });
    if (!drive) return res.status(404).json({ error: 'Placement drive not found' });

    const student = await prisma.user.findUnique({ where: { id: req.user.id } });
    const studentCgpa = student?.cgpa ?? 8.45;
    const studentBacklogs = student?.activeBacklogs ?? 0;

    // Verify eligibility
    if (studentCgpa < drive.minCgpa) {
      return res.status(400).json({ error: `CGPA requirement not met (Requires ${drive.minCgpa}, you have ${studentCgpa})` });
    }
    if (studentBacklogs > drive.maxBacklogs) {
      return res.status(400).json({ error: `Active backlogs detected. Zero active backlogs required.` });
    }

    // Check existing
    const existing = await prisma.placementApplication.findUnique({
      where: {
        driveId_studentId: {
          driveId,
          studentId: req.user.id
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already applied to this drive.' });
    }

    const application = await prisma.placementApplication.create({
      data: {
        driveId,
        studentId: req.user.id,
        status: 'APPLIED',
        remarks: 'Application submitted via student portal.'
      },
      include: {
        drive: true
      }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Apply Drive Error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get student's applications
router.get('/my-applications', authenticateToken, async (req, res) => {
  try {
    const apps = await prisma.placementApplication.findMany({
      where: { studentId: req.user.id },
      include: {
        drive: true
      },
      orderBy: { appliedAt: 'desc' }
    });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch personal applications' });
  }
});

// ============================================================================
// 2. PLACEMENT OFFICER & ADMIN CRM ENDPOINTS
// ============================================================================

// Admin / TPO: Get all student applications across drives
router.get('/admin/all-applications', authenticateToken, authorizeRoles('ADMIN', 'FACULTY', 'FACULTY_ADVISOR', 'PLACEMENT_OFFICER'), async (req, res) => {
  try {
    const { driveId, status } = req.query;
    const where = {};
    if (driveId && driveId !== 'ALL') where.driveId = parseInt(driveId);
    if (status && status !== 'ALL') where.status = status;

    const applications = await prisma.placementApplication.findMany({
      where,
      include: {
        drive: true,
        student: {
          select: {
            id: true,
            name: true,
            userId: true,
            email: true,
            department: true,
            programme: true,
            batch: true,
            semester: true,
            cgpa: true,
            activeBacklogs: true,
            contactNumber: true
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    res.json(applications);
  } catch (error) {
    console.error('Fetch All Applications Error:', error);
    res.status(500).json({ error: 'Failed to fetch placement applications' });
  }
});

// Admin / TPO: Placement CRM Statistics
router.get('/admin/stats', authenticateToken, authorizeRoles('ADMIN', 'FACULTY', 'FACULTY_ADVISOR', 'PLACEMENT_OFFICER'), async (req, res) => {
  try {
    const totalDrives = await prisma.placementDrive.count();
    const activeDrives = await prisma.placementDrive.count({ where: { status: 'ACTIVE' } });
    const totalApplications = await prisma.placementApplication.count();
    const shortlistedCount = await prisma.placementApplication.count({ where: { status: 'SHORTLISTED' } });
    const interviewCount = await prisma.placementApplication.count({ where: { status: 'INTERVIEW_SCHEDULED' } });
    const offeredCount = await prisma.placementApplication.count({ where: { status: { in: ['OFFERED', 'SELECTED'] } } });

    // Placement requests stats
    const requests = getPlacementRequests();
    const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
    const approvedRequests = requests.filter(r => r.status === 'APPROVED').length;

    res.json({
      totalDrives,
      activeDrives,
      totalApplications,
      shortlistedCount,
      interviewCount,
      offeredCount,
      totalRequests: requests.length,
      pendingRequests,
      approvedRequests
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch placement statistics' });
  }
});

// Create a new placement drive (TPO / Admin)
router.post('/drives', authenticateToken, authorizeRoles('ADMIN', 'FACULTY', 'FACULTY_ADVISOR', 'PLACEMENT_OFFICER'), async (req, res) => {
  try {
    const { companyName, role, type, ctc, location, minCgpa, allowedBranches, maxBacklogs, deadline, description, selectionRounds } = req.body;
    if (!companyName || !role || !ctc) {
      return res.status(400).json({ error: 'Company name, role, and CTC are required' });
    }

    const drive = await prisma.placementDrive.create({
      data: {
        companyName,
        role,
        type: type || 'FULL_TIME',
        ctc,
        location: location || 'Pune / Bengaluru',
        minCgpa: minCgpa ? parseFloat(minCgpa) : 7.0,
        allowedBranches: allowedBranches || 'CSE,ECE',
        maxBacklogs: maxBacklogs ? parseInt(maxBacklogs) : 0,
        deadline: deadline || new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
        description: description || 'Exciting engineering opportunity.',
        selectionRounds: selectionRounds || 'Online Assessment -> Technical Round -> HR Round',
        status: 'ACTIVE'
      }
    });

    res.status(201).json(drive);
  } catch (error) {
    console.error('Create Drive Error:', error);
    res.status(500).json({ error: 'Failed to create placement drive' });
  }
});

// Update application status & schedule interview (TPO / Admin)
router.put('/applications/:id/status', authenticateToken, authorizeRoles('ADMIN', 'FACULTY', 'FACULTY_ADVISOR', 'PLACEMENT_OFFICER'), async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const { status, interviewSlot, interviewLink, remarks } = req.body;

    const updated = await prisma.placementApplication.update({
      where: { id: appId },
      data: {
        status,
        interviewSlot,
        interviewLink,
        remarks
      },
      include: {
        student: { select: { id: true, name: true, userId: true, email: true } },
        drive: true
      }
    });

    // Persist notification for student
    await prisma.notification.create({
      data: {
        recipientId: updated.studentId,
        title: `Placement Update: ${updated.drive.companyName}`,
        message: `Your application status for ${updated.drive.companyName} (${updated.drive.role}) is now "${status}". ${interviewSlot ? `Interview Slot: ${interviewSlot}.` : ''} ${remarks || ''}`.trim(),
        type: ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'SELECTED'].includes(status) ? 'SUCCESS' : 'INFO',
        category: 'PLACEMENT'
      }
    }).catch(() => {});

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Delete a placement drive (Admin / TPO)
router.delete('/drives/:id', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.placementDrive.delete({ where: { id } });
    res.json({ message: 'Placement drive deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete placement drive' });
  }
});

// ============================================================================
// 3. STUDENT PLACEMENT REQUESTS & NOC DESK (Student <-> Placement Officer)
// ============================================================================

// Get placement requests (Students get their own; Officers/Admin get all)
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const requests = getPlacementRequests();
    const isOfficerOrAdmin = ['ADMIN', 'PLACEMENT_OFFICER', 'FACULTY', 'FACULTY_ADVISOR'].includes(req.user.role);

    if (isOfficerOrAdmin) {
      res.json(requests);
    } else {
      const studentRequests = requests.filter(r => r.studentId === req.user.id || r.studentMis === req.user.userId);
      res.json(studentRequests);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch placement requests' });
  }
});

// Student submits a placement request (NOC, Duty Leave, Resume Verification, PPO Intimation)
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const { type, companyName, role, duration, stipend, location, details } = req.body;
    if (!type || !companyName) {
      return res.status(400).json({ error: 'Request type and Company Name are required.' });
    }

    const student = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, userId: true, email: true, department: true, cgpa: true, activeBacklogs: true }
    });

    const requests = getPlacementRequests();
    const newReq = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      studentId: req.user.id,
      studentName: student?.name || req.user.name || 'Student',
      studentMis: student?.userId || req.user.userId || '112415079',
      studentEmail: student?.email || req.user.email,
      department: student?.department || 'CSE',
      cgpa: student?.cgpa ?? 8.45,
      activeBacklogs: student?.activeBacklogs ?? 0,
      type: type || 'INTERNSHIP_NOC',
      companyName: companyName.trim(),
      role: (role || 'Engineering Intern').trim(),
      duration: (duration || '6 Months').trim(),
      stipend: (stipend || 'Competitive').trim(),
      location: (location || 'Pune / Bengaluru').trim(),
      details: (details || 'Submitted via student placement portal.').trim(),
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      officerRemarks: null,
      nocCertificateNumber: null
    };

    requests.unshift(newReq);
    savePlacementRequests(requests);

    res.status(201).json(newReq);
  } catch (error) {
    console.error('Submit Placement Request Error:', error);
    res.status(500).json({ error: 'Failed to submit placement request' });
  }
});

// Placement Officer / Admin reviews student request
router.put('/requests/:id/review', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['APPROVED', 'REJECTED', 'UNDER_REVIEW', 'ACTION_REQUIRED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid review status' });
    }

    const requests = getPlacementRequests();
    const index = requests.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Placement request not found' });
    }

    const currentReq = requests[index];
    const isApproved = status === 'APPROVED';

    let nocCertificateNumber = currentReq.nocCertificateNumber;
    if (isApproved && currentReq.type === 'INTERNSHIP_NOC' && !nocCertificateNumber) {
      nocCertificateNumber = `IIITP/TPO/NOC/2026/${Math.floor(100 + Math.random() * 900)}`;
    }

    requests[index] = {
      ...currentReq,
      status,
      officerRemarks: remarks || (isApproved ? 'Approved by Training & Placement Cell.' : 'Rejected per TPO eligibility guidelines.'),
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user.name || 'Training & Placement Officer',
      nocCertificateNumber
    };

    savePlacementRequests(requests);

    // Notify student
    if (currentReq.studentId) {
      await prisma.notification.create({
        data: {
          recipientId: currentReq.studentId,
          title: `T&P Request Update: ${currentReq.type} (${currentReq.companyName})`,
          message: `Your request (${currentReq.id}) has been ${status}. ${nocCertificateNumber ? `Issued NOC: ${nocCertificateNumber}.` : ''} Remarks: ${remarks || ''}`.trim(),
          type: isApproved ? 'SUCCESS' : 'WARNING',
          category: 'PLACEMENT'
        }
      }).catch(() => {});
    }

    res.json(requests[index]);
  } catch (error) {
    console.error('Review Request Error:', error);
    res.status(500).json({ error: 'Failed to review request' });
  }
});

// Student withdraws a request
router.delete('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let requests = getPlacementRequests();
    const target = requests.find(r => r.id === id);

    if (!target) return res.status(404).json({ error: 'Request not found' });
    if (target.studentId !== req.user.id && !['ADMIN', 'PLACEMENT_OFFICER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized to delete this request' });
    }

    requests = requests.filter(r => r.id !== id);
    savePlacementRequests(requests);

    res.json({ message: 'Request removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove request' });
  }
});

export default router;
