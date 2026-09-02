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
      },
      orderBy: { userId: 'asc' },
    });

    // Filter students by section if specified
    if (section) {
      students = students.filter(s => {
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

    const upsertPromises = records.map((rec) =>
      prisma.attendanceRecord.upsert({
        where: {
          subjectCode_date_studentId: {
            subjectCode,
            date,
            studentId: rec.studentId,
          },
        },
        update: {
          status: rec.status,
          section,
          subjectName,
          facultyId,
          facultyName,
        },
        create: {
          subjectCode,
          subjectName: subjectName || subjectCode,
          section,
          date,
          studentId: rec.studentId,
          facultyId,
          facultyName,
          status: rec.status,
        },
      })
    );

    const savedRecords = await Promise.all(upsertPromises);
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

    const records = await prisma.attendanceRecord.findMany({
      where: { subjectCode, section, date },
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Student Attendance Summary (Student view)
router.get('/student-summary', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get all attendance entries for this student
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    // Determine student section & relevant subjects
    const isEce = (req.user.email || '').includes('@ece.');
    const userIdStr = String(req.user.userId || req.user.email || '').split('@')[0];
    const misNum = parseInt(userIdStr.slice(-3)) || 0;
    const studentSection = isEce 
      ? 'Section C (ECE)' 
      : misNum <= 82 
      ? 'Section A (CSE)' 
      : 'Section B (CSE)';

    const relevantSubjects = SUBJECT_DIRECTORY.filter(s => s.section === studentSection);

    // Calculate subject-wise metrics
    const summary = relevantSubjects.map((sub) => {
      const subRecords = records.filter(r => r.subjectCode === sub.code);
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
      };
    });

    res.json({
      studentSection,
      summary,
      detailedHistory: records,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
