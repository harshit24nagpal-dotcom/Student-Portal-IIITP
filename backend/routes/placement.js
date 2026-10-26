import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

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
    const studentBranch = student?.department || 'CSE';

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

// Create a new placement drive (TPO / Admin)
router.post('/drives', authenticateToken, authorizeRoles('ADMIN', 'FACULTY', 'FACULTY_ADVISOR'), async (req, res) => {
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
router.put('/applications/:id/status', authenticateToken, authorizeRoles('ADMIN', 'FACULTY', 'FACULTY_ADVISOR'), async (req, res) => {
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

export default router;
