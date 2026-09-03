import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Official IIIT Pune Odd Semester Subject Directory per Section
const SUBJECT_DIRECTORY = [
  // SECTION A (CSE)
  { code: 'LNO', name: 'Linear and Non-Linear Optimization', section: 'Section A (CSE)', facultyName: 'Ms. Anagha Khiste' },
  { code: 'ML', name: 'Machine Learning', section: 'Section A (CSE)', facultyName: 'Dr. Sunita Chaki' },
  { code: 'HCI', name: 'Human Computer Interaction', section: 'Section A (CSE)', facultyName: 'Dr. Shrikant Salve' },
  { code: 'SE', name: 'Software Engineering', section: 'Section A (CSE)', facultyName: 'Ms. Anupama Avan' },
  { code: 'CNS', name: 'Cryptography and Network Security', section: 'Section A (CSE)', facultyName: 'Dr. Shrirang Shukla' },
  { code: 'ADS', name: 'Advanced Data Structures', section: 'Section A (CSE)', facultyName: 'Dr. Suraj Kumar' },

  // SECTION B (CSE)
  { code: 'LNO', name: 'Linear and Non-Linear Optimization', section: 'Section B (CSE)', facultyName: 'Ms. Anagha Khiste' },
  { code: 'ML', name: 'Machine Learning', section: 'Section B (CSE)', facultyName: 'Mr. Prabhat Sen' },
  { code: 'HCI', name: 'Human Computer Interaction', section: 'Section B (CSE)', facultyName: 'Dr. Shrikant Salve' },
  { code: 'SE', name: 'Software Engineering', section: 'Section B (CSE)', facultyName: 'Ms. Anupama Avan' },
  { code: 'CNS', name: 'Cryptography and Network Security', section: 'Section B (CSE)', facultyName: 'Dr. Shrirang Shukla' },
  { code: 'ADS', name: 'Advanced Data Structures', section: 'Section B (CSE)', facultyName: 'Dr. Suraj Kumar' },

  // SECTION C (ECE)
  { code: 'ML', name: 'Machine Learning', section: 'Section C (ECE)', facultyName: 'Mr. Prabhat Sen' },
  { code: 'MS', name: 'Modeling & Synthesis with Verilog', section: 'Section C (ECE)', facultyName: 'Dr. Avinash Singh' },
  { code: 'DC', name: 'Digital Communication', section: 'Section C (ECE)', facultyName: 'Dr. Nagendra Kushwaha' },
  { code: 'VLSI', name: 'VLSI Design', section: 'Section C (ECE)', facultyName: 'Swaminathan M.A.' },
  { code: 'ETA', name: 'Electromagnetic Theory and Applications', section: 'Section C (ECE)', facultyName: 'Dr. S.M. Divya Chaturvedi' },
  { code: 'IP', name: 'Image Processing', section: 'Section C (ECE)', facultyName: 'Dr. Md. Akhlaqur Rahman' },
];

// GET list of available subjects and sections
router.get('/subjects', authenticateToken, (req, res) => {
  res.json(SUBJECT_DIRECTORY);
});

// GET student roster for a specific section
router.get('/section-students', authenticateToken, async (req, res) => {
  try {
    const { section } = req.query;

    let students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        contactNumber: true,
        section: true,
        department: true,
        batch: true,
      },
      orderBy: { userId: 'asc' },
    });

    if (section) {
      students = students.filter(s => {
        if (s.section === section) return true;
        const uStr = String(s.userId || s.email || '').split('@')[0];
        const misNum = parseInt(uStr.slice(-3)) || 0;
        if (section.includes('Section A')) {
          return s.email.includes('@cse.') && misNum <= 82;
        } else if (section.includes('Section B')) {
          return s.email.includes('@cse.') && misNum > 82;
        } else if (section.includes('Section C') || section.includes('ECE')) {
          return s.email.includes('@ece.');
        }
        return true;
      });
    }

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Mark daily attendance (Faculty/Admin action)
router.post('/mark', authenticateToken, async (req, res) => {
  try {
    const { subjectCode, subjectName, section, date, records } = req.body;

    if (!subjectCode || !section || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Missing required attendance data fields' });
    }

    const facultyName = req.user.name || 'Faculty Instructor';
    const facultyId = req.user.id;

    // Find or create active semester and course for relational sync
    let activeSem = await prisma.semester.findFirst({ where: { isActive: true } });
    if (!activeSem) {
      activeSem = await prisma.semester.create({
        data: { name: 'Odd Semester 2026-27', year: 2026, term: 'ODD', startDate: '2026-07-15', endDate: '2026-12-15', isActive: true }
      });
    }

    let course = await prisma.course.findFirst({
      where: { code: subjectCode, section, semesterId: activeSem.id }
    });
    if (!course) {
      course = await prisma.course.create({
        data: { code: subjectCode, name: subjectName || subjectCode, section, semesterId: activeSem.id, facultyId }
      });
    }

    let session = await prisma.attendanceSession.findFirst({
      where: { courseId: course.id, date }
    });
    if (!session) {
      session = await prisma.attendanceSession.create({
        data: { courseId: course.id, date, conductedById: facultyId, topic: `Lecture on ${date}` }
      });
    }

    const upsertPromises = records.map((rec) =>
      prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: rec.studentId,
          },
        },
        update: {
          status: rec.status,
        },
        create: {
          sessionId: session.id,
          courseId: course.id,
          studentId: rec.studentId,
          status: rec.status,
        },
      })
    );

    const savedRecords = await Promise.all(upsertPromises);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: facultyId,
        action: 'ATTENDANCE_MARKED',
        module: 'ATTENDANCE',
        details: `Marked attendance for ${subjectCode} (${section}) on ${date} (${savedRecords.length} students)`
      }
    });

    res.json({ message: `Successfully saved ${savedRecords.length} attendance entries`, count: savedRecords.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET existing attendance record for a subject, section & date
router.get('/marked-sheet', authenticateToken, async (req, res) => {
  try {
    const { subjectCode, section, date } = req.query;
    if (!subjectCode || !section || !date) {
      return res.status(400).json({ error: 'subjectCode, section, and date are required' });
    }

    const session = await prisma.attendanceSession.findFirst({
      where: {
        course: { code: subjectCode, section },
        date
      },
      include: { records: true }
    });

    res.json(session ? session.records : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Student Attendance Summary (Student view)
router.get('/student-summary', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        course: true,
        session: true
      },
      orderBy: { session: { date: 'desc' } },
    });

    const isEce = (req.user.email || '').includes('@ece.');
    const userIdStr = String(req.user.userId || req.user.email || '').split('@')[0];
    const misNum = parseInt(userIdStr.slice(-3)) || 0;
    const studentSection = req.user.section || (isEce 
      ? 'Section C (ECE)' 
      : misNum <= 82 
      ? 'Section A (CSE)' 
      : 'Section B (CSE)');

    const relevantSubjects = SUBJECT_DIRECTORY.filter(s => s.section === studentSection);

    const summary = relevantSubjects.map((sub) => {
      const subRecords = records.filter(r => r.course && r.course.code === sub.code);
      const totalClasses = subRecords.length;
      const attendedClasses = subRecords.filter(r => r.status === 'PRESENT').length;
      const absentClasses = subRecords.filter(r => r.status === 'ABSENT').length;
      const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

      return {
        subjectCode: sub.code,
        subjectName: sub.name,
        facultyName: sub.facultyName,
        section: sub.section,
        totalClasses,
        attendedClasses,
        absentClasses,
        percentage,
        isShortage: percentage < 75,
        isCriticalShortage: percentage < 65,
      };
    });

    res.json({
      studentSection,
      summary,
      detailedHistory: records.map(r => ({
        id: r.id,
        subjectCode: r.course?.code,
        subjectName: r.course?.name,
        date: r.session?.date,
        status: r.status
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Faculty Advisor Students & Low Attendance Alerts
router.get('/advisor-students', authenticateToken, async (req, res) => {
  try {
    if (!['FACULTY_ADVISOR', 'FACULTY', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Faculty Advisor role required.' });
    }

    // Get all students
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        contactNumber: true,
        section: true,
        department: true,
        programme: true,
        batch: true,
        attendanceRecords: {
          include: { course: true }
        }
      },
      orderBy: { userId: 'asc' }
    });

    // Calculate each student's overall attendance %
    const studentMetrics = students.map((s) => {
      const total = s.attendanceRecords.length;
      const attended = s.attendanceRecords.filter(r => r.status === 'PRESENT').length;
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;
      let alertLevel = 'NORMAL';
      if (percentage < 65) alertLevel = 'CRITICAL';
      else if (percentage < 75) alertLevel = 'WARNING';

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        userId: s.userId,
        contactNumber: s.contactNumber,
        section: s.section,
        department: s.department,
        batch: s.batch,
        totalClasses: total,
        attendedClasses: attended,
        absentClasses: total - attended,
        percentage,
        alertLevel
      };
    });

    res.json(studentMetrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
