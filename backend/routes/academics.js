import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const TIMETABLE_FILE = path.join(DATA_DIR, 'timetable.json');
const SYLLABUS_FILE = path.join(DATA_DIR, 'syllabus.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Timetable Seed Data (IIIT Pune B.Tech Odd Semester)
const DEFAULT_TIMETABLE = [
  // MONDAY
  { id: 1, day: 'Monday', timeSlot: '09:30 AM - 10:30 AM', subjectCode: 'LNO', subjectName: 'Linear and Non-Linear Optimization', facultyName: 'Ms. Anagha Khiste', room: 'LH-102', section: 'Section A (CSE)' },
  { id: 2, day: 'Monday', timeSlot: '11:30 AM - 12:30 PM', subjectCode: 'ML', subjectName: 'Machine Learning', facultyName: 'Dr. Sunita Chaki', room: 'LH-101', section: 'Section A (CSE)' },
  { id: 3, day: 'Monday', timeSlot: '02:00 PM - 04:00 PM', subjectCode: 'ADS', subjectName: 'Advanced Data Structures (Lab)', facultyName: 'Dr. Suraj Kumar', room: 'Computer Lab 3', section: 'Section A (CSE)' },

  // TUESDAY
  { id: 4, day: 'Tuesday', timeSlot: '10:00 AM - 11:00 AM', subjectCode: 'HCI', subjectName: 'Human Computer Interaction', facultyName: 'Dr. Shrikant Salve', room: 'LH-103', section: 'Section A (CSE)' },
  { id: 5, day: 'Tuesday', timeSlot: '11:30 AM - 12:30 PM', subjectCode: 'SE', subjectName: 'Software Engineering', facultyName: 'Ms. Anupama Avan', room: 'LH-102', section: 'Section A (CSE)' },
  { id: 6, day: 'Tuesday', timeSlot: '02:30 PM - 03:30 PM', subjectCode: 'CNS', subjectName: 'Cryptography and Network Security', facultyName: 'Dr. Shrirang Shukla', room: 'LH-101', section: 'Section A (CSE)' },

  // WEDNESDAY
  { id: 7, day: 'Wednesday', timeSlot: '09:30 AM - 10:30 AM', subjectCode: 'LNO', subjectName: 'Linear and Non-Linear Optimization', facultyName: 'Ms. Anagha Khiste', room: 'LH-102', section: 'Section A (CSE)' },
  { id: 8, day: 'Wednesday', timeSlot: '11:00 AM - 01:00 PM', subjectCode: 'ML', subjectName: 'Machine Learning (Lab)', facultyName: 'Dr. Sunita Chaki', room: 'Computer Lab 2', section: 'Section A (CSE)' },
  { id: 9, day: 'Wednesday', timeSlot: '03:00 PM - 04:00 PM', subjectCode: 'ADS', subjectName: 'Advanced Data Structures', facultyName: 'Dr. Suraj Kumar', room: 'LH-101', section: 'Section A (CSE)' },

  // THURSDAY
  { id: 10, day: 'Thursday', timeSlot: '10:00 AM - 11:00 AM', subjectCode: 'HCI', subjectName: 'Human Computer Interaction', facultyName: 'Dr. Shrikant Salve', room: 'LH-103', section: 'Section A (CSE)' },
  { id: 11, day: 'Thursday', timeSlot: '11:30 AM - 12:30 PM', subjectCode: 'SE', subjectName: 'Software Engineering', facultyName: 'Ms. Anupama Avan', room: 'LH-102', section: 'Section A (CSE)' },
  { id: 12, day: 'Thursday', timeSlot: '02:00 PM - 04:00 PM', subjectCode: 'CNS', subjectName: 'Cryptography Lab', facultyName: 'Dr. Shrirang Shukla', room: 'Computer Lab 1', section: 'Section A (CSE)' },

  // FRIDAY
  { id: 13, day: 'Friday', timeSlot: '09:30 AM - 10:30 AM', subjectCode: 'LNO', subjectName: 'Optimization Tutorial & Problem Solving', facultyName: 'Ms. Anagha Khiste', room: 'LH-102', section: 'Section A (CSE)' },
  { id: 14, day: 'Friday', timeSlot: '11:00 AM - 12:00 PM', subjectCode: 'ML', subjectName: 'Machine Learning', facultyName: 'Dr. Sunita Chaki', room: 'LH-101', section: 'Section A (CSE)' },
  { id: 15, day: 'Friday', timeSlot: '02:30 PM - 04:30 PM', subjectCode: 'PROJ', subjectName: 'Capstone Project & Mentorship Session', facultyName: 'Faculty Mentors', room: 'Seminar Hall A', section: 'Section A (CSE)' }
];

// Initial Syllabus & Course Plan Seed Data
const DEFAULT_SYLLABUS = {
  LNO: {
    code: 'LNO',
    title: 'Linear and Non-Linear Optimization',
    instructor: 'Ms. Anagha Khiste',
    department: 'CSE',
    credits: 4,
    totalLectures: 42,
    completedLectures: 26,
    units: [
      { id: 1, unitNumber: 'Unit 1', title: 'Unconstrained Optimization & Gradient Descent', status: 'COMPLETED', lectures: 8, topics: 'Convex sets, Taylor series, Steepest Descent, Newton-Raphson method' },
      { id: 2, unitNumber: 'Unit 2', title: 'Convex Functions & Optimality Criteria', status: 'COMPLETED', lectures: 8, topics: 'Sub-gradients, Epigraphs, Quasiconvex functions, Karush-Kuhn-Tucker (KKT) conditions' },
      { id: 3, unitNumber: 'Unit 3', title: 'Constrained Non-Linear Optimization', status: 'IN_PROGRESS', lectures: 9, topics: 'Lagrangian multipliers, Barrier methods, Penalty functions, Augmented Lagrangian' },
      { id: 4, unitNumber: 'Unit 4', title: 'Linear Programming & Simplex Algorithm', status: 'UPCOMING', lectures: 9, topics: 'Standard form LP, Revised Simplex, Dual Simplex, Sensitivity analysis' },
      { id: 5, unitNumber: 'Unit 5', title: 'Duality Theory, Game Theory & Evolutionary Algos', status: 'UPCOMING', lectures: 8, topics: 'Primal-Dual relations, Zero-sum games, Genetic Algorithms, Simulated Annealing' }
    ],
    materials: [
      { id: 1, title: 'Lecture 1-8 Notes: Convexity and Gradient Methods', link: '/uploads/materials/LNO_Unit1_Notes.pdf', date: '2026-09-12' },
      { id: 2, title: 'KKT Conditions Problem Set & Solutions', link: '/uploads/materials/LNO_KKT_Assignment.pdf', date: '2026-10-05' }
    ]
  },
  HCI: {
    code: 'HCI',
    title: 'Human Computer Interaction',
    instructor: 'Dr. Shrikant Salve',
    department: 'CSE',
    credits: 3,
    totalLectures: 36,
    completedLectures: 22,
    units: [
      { id: 1, unitNumber: 'Unit 1', title: 'Foundations of HCI & Cognitive Ergonomics', status: 'COMPLETED', lectures: 7, topics: 'Human visual and memory models, Fitts Law, Hick-Hyman Law, Norman’s 7 Principles' },
      { id: 2, unitNumber: 'Unit 2', title: 'User-Centered Design & Contextual Inquiries', status: 'COMPLETED', lectures: 7, topics: 'Personas, Empathy mapping, Affinity diagrams, Task analysis, User journeys' },
      { id: 3, unitNumber: 'Unit 3', title: 'Prototyping & Wireframing Interaction Paradigms', status: 'IN_PROGRESS', lectures: 8, topics: 'Low-fi vs High-fi prototyping, Micro-interactions, Heuristic evaluation (Nielsen)' },
      { id: 4, unitNumber: 'Unit 4', title: 'Usability Testing & Empirical Analytics', status: 'UPCOMING', lectures: 7, topics: 'A/B testing, SUS score computation, Eye-tracking analytics, Accessibility (WCAG 2.1)' },
      { id: 5, unitNumber: 'Unit 5', title: 'Multimodal Interfaces, AR/VR & Conversational AI', status: 'UPCOMING', lectures: 7, topics: 'Speech UI, Gesture recognition, Spatial UI for AR/VR, LLM agent interfaces' }
    ],
    materials: [
      { id: 1, title: 'Norman’s Design of Everyday Things - Study Guide', link: '/uploads/materials/HCI_Norman_Principles.pdf', date: '2026-09-10' },
      { id: 2, title: 'Wireframing & Figma Component Kit for Lab 3', link: '/uploads/materials/HCI_Figma_Kit.pdf', date: '2026-10-02' }
    ]
  },
  ML: {
    code: 'ML',
    title: 'Machine Learning',
    instructor: 'Dr. Sunita Chaki',
    department: 'CSE',
    credits: 4,
    totalLectures: 40,
    completedLectures: 24,
    units: [
      { id: 1, unitNumber: 'Unit 1', title: 'Supervised Learning & Regression', status: 'COMPLETED', lectures: 8, topics: 'Linear regression, Regularization (L1/L2), Logistic regression, ROC-AUC' },
      { id: 2, unitNumber: 'Unit 2', title: 'Classification Models & Ensemble Learning', status: 'COMPLETED', lectures: 8, topics: 'Decision trees, Random Forests, Gradient Boosted Trees (XGBoost), SVM' },
      { id: 3, unitNumber: 'Unit 3', title: 'Unsupervised Learning & Dimensionality Reduction', status: 'IN_PROGRESS', lectures: 8, topics: 'K-Means++, DBSCAN, PCA, t-SNE, Autoencoders' },
      { id: 4, unitNumber: 'Unit 4', title: 'Neural Networks & Deep Learning Foundations', status: 'UPCOMING', lectures: 8, topics: 'Multilayer perceptrons, Backpropagation, CNNs, Transformers basics' },
      { id: 5, unitNumber: 'Unit 5', title: 'Reinforcement Learning & Ethics in AI', status: 'UPCOMING', lectures: 8, topics: 'Markov Decision Processes, Q-Learning, Model Explainability (SHAP/LIME)' }
    ],
    materials: [
      { id: 1, title: 'Regression & Ensemble Methods Cheat Sheet', link: '/uploads/materials/ML_Ensemble_Notes.pdf', date: '2026-09-15' }
    ]
  }
};

// Helper: load timetable
function loadTimetable() {
  try {
    if (!fs.existsSync(TIMETABLE_FILE)) {
      fs.writeFileSync(TIMETABLE_FILE, JSON.stringify(DEFAULT_TIMETABLE, null, 2));
      return DEFAULT_TIMETABLE;
    }
    const raw = fs.readFileSync(TIMETABLE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading timetable:', err);
    return DEFAULT_TIMETABLE;
  }
}

// Helper: save timetable
function saveTimetable(data) {
  try {
    fs.writeFileSync(TIMETABLE_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving timetable:', err);
    return false;
  }
}

// Helper: load syllabus
function loadSyllabus() {
  try {
    if (!fs.existsSync(SYLLABUS_FILE)) {
      fs.writeFileSync(SYLLABUS_FILE, JSON.stringify(DEFAULT_SYLLABUS, null, 2));
      return DEFAULT_SYLLABUS;
    }
    const raw = fs.readFileSync(SYLLABUS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading syllabus:', err);
    return DEFAULT_SYLLABUS;
  }
}

// Helper: save syllabus
function saveSyllabus(data) {
  try {
    fs.writeFileSync(SYLLABUS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving syllabus:', err);
    return false;
  }
}

// ===================================================================
// TIMETABLE ROUTES
// ===================================================================

// 1. GET Timetable (Filter by Section or Day)
router.get('/timetable', authenticateToken, (req, res) => {
  try {
    const { section = 'Section A (CSE)', day } = req.query;
    let list = loadTimetable();

    if (section && section !== 'ALL') {
      list = list.filter(item => item.section.toLowerCase().includes(section.toLowerCase()) || item.section === 'ALL');
    }

    if (day && day !== 'ALL') {
      list = list.filter(item => item.day.toLowerCase() === day.toLowerCase());
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Add Timetable Slot (Admin, Faculty, Faculty Advisor)
router.post('/timetable', authenticateToken, authorizeRoles('ADMIN', 'FACULTY', 'FACULTY_ADVISOR'), (req, res) => {
  try {
    const { day, timeSlot, subjectCode, subjectName, facultyName, room, section } = req.body;
    if (!day || !timeSlot || !subjectName || !room) {
      return res.status(400).json({ error: 'Day, time slot, subject name, and room are required' });
    }

    const list = loadTimetable();
    const newEntry = {
      id: Date.now(),
      day: day.trim(),
      timeSlot: timeSlot.trim(),
      subjectCode: (subjectCode || 'GEN').toUpperCase().trim(),
      subjectName: subjectName.trim(),
      facultyName: facultyName?.trim() || req.user.name,
      room: room.trim(),
      section: section?.trim() || 'Section A (CSE)'
    };

    list.push(newEntry);
    saveTimetable(list);

    // Emit live socket update
    const io = req.app.get('io');
    if (io) io.emit('timetable_updated', { type: 'CREATED', entry: newEntry });

    res.status(201).json({ message: 'Lecture slot added to institutional timetable!', entry: newEntry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Edit Timetable Slot (Admin, Faculty, Faculty Advisor)
router.put('/timetable/:id', authenticateToken, authorizeRoles('ADMIN', 'FACULTY', 'FACULTY_ADVISOR'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { day, timeSlot, subjectCode, subjectName, facultyName, room, section } = req.body;

    const list = loadTimetable();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Timetable entry not found' });
    }

    list[idx] = {
      ...list[idx],
      day: day ? day.trim() : list[idx].day,
      timeSlot: timeSlot ? timeSlot.trim() : list[idx].timeSlot,
      subjectCode: subjectCode ? subjectCode.toUpperCase().trim() : list[idx].subjectCode,
      subjectName: subjectName ? subjectName.trim() : list[idx].subjectName,
      facultyName: facultyName ? facultyName.trim() : list[idx].facultyName,
      room: room ? room.trim() : list[idx].room,
      section: section ? section.trim() : list[idx].section
    };

    saveTimetable(list);

    const io = req.app.get('io');
    if (io) io.emit('timetable_updated', { type: 'UPDATED', entry: list[idx] });

    res.json({ message: 'Timetable entry updated successfully!', entry: list[idx] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE Timetable Slot (Admin, Faculty, Faculty Advisor)
router.delete('/timetable/:id', authenticateToken, authorizeRoles('ADMIN', 'FACULTY', 'FACULTY_ADVISOR'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let list = loadTimetable();
    const exists = list.some(item => item.id === id);
    if (!exists) {
      return res.status(404).json({ error: 'Timetable slot not found' });
    }

    list = list.filter(item => item.id !== id);
    saveTimetable(list);

    const io = req.app.get('io');
    if (io) io.emit('timetable_updated', { type: 'DELETED', id });

    res.json({ message: 'Timetable slot deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================================================================
// SYLLABUS & COURSE PLAN ROUTES
// ===================================================================

// 5. GET Syllabus by Subject Code
router.get('/syllabus/:code', authenticateToken, (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const all = loadSyllabus();
    const syllabus = all[code];

    if (!syllabus) {
      return res.json({
        code,
        title: `${code} Course Plan`,
        instructor: 'Course Instructor',
        totalLectures: 36,
        completedLectures: 18,
        units: [
          { id: 1, unitNumber: 'Unit 1', title: 'Fundamental Concepts & Prerequisites', status: 'COMPLETED', lectures: 7, topics: 'Foundational theory and core axioms' },
          { id: 2, unitNumber: 'Unit 2', title: 'Core Principles & Formulations', status: 'COMPLETED', lectures: 7, topics: 'Mathematical modeling and system analysis' },
          { id: 3, unitNumber: 'Unit 3', title: 'Intermediate Applications & Case Studies', status: 'IN_PROGRESS', lectures: 8, topics: 'Practical applications and algorithmic implementations' },
          { id: 4, unitNumber: 'Unit 4', title: 'Advanced Topics & Emerging Trends', status: 'UPCOMING', lectures: 7, topics: 'State-of-the-art approaches and research literature' },
          { id: 5, unitNumber: 'Unit 5', title: 'System Synthesis & Project Review', status: 'UPCOMING', lectures: 7, topics: 'Design synthesis, project evaluations, and final review' }
        ],
        materials: []
      });
    }

    res.json(syllabus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. PUT Update Syllabus Unit Status (Faculty Instructor or Admin)
router.put('/syllabus/:code/unit/:unitId', authenticateToken, authorizeRoles('FACULTY', 'FACULTY_ADVISOR', 'ADMIN'), (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const unitId = parseInt(req.params.unitId);
    const { status, completedLectures } = req.body;

    const all = loadSyllabus();
    if (!all[code]) {
      return res.status(404).json({ error: 'Syllabus not found' });
    }

    const unit = all[code].units.find(u => u.id === unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    if (status) unit.status = status;
    if (completedLectures !== undefined) all[code].completedLectures = parseInt(completedLectures);

    saveSyllabus(all);
    res.json({ message: 'Unit status updated!', syllabus: all[code] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;