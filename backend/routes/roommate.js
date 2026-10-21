import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Compatibility weightings
const COMPATIBILITY_WEIGHTS = {
  sleep: 0.25,
  study: 0.25,
  cleanliness: 0.20,
  diet: 0.15,
  hobby: 0.15
};

function calculateCompatibility(myPref, otherPref) {
  let score = 0;

  // 1. Sleep Schedule (25%)
  if (myPref.sleepSchedule === otherPref.sleepSchedule) {
    score += 100 * COMPATIBILITY_WEIGHTS.sleep;
  } else if (myPref.sleepSchedule === 'FLEXIBLE' || otherPref.sleepSchedule === 'FLEXIBLE') {
    score += 75 * COMPATIBILITY_WEIGHTS.sleep;
  } else {
    score += 25 * COMPATIBILITY_WEIGHTS.sleep;
  }

  // 2. Study Habit (25%)
  if (myPref.studyHabit === otherPref.studyHabit) {
    score += 100 * COMPATIBILITY_WEIGHTS.study;
  } else if (myPref.studyHabit === 'LIBRARY' || otherPref.studyHabit === 'LIBRARY') {
    score += 70 * COMPATIBILITY_WEIGHTS.study;
  } else {
    score += 30 * COMPATIBILITY_WEIGHTS.study;
  }

  // 3. Cleanliness (20%)
  if (myPref.cleanlinessLevel === otherPref.cleanlinessLevel) {
    score += 100 * COMPATIBILITY_WEIGHTS.cleanliness;
  } else if (myPref.cleanlinessLevel === 'MODERATE' || otherPref.cleanlinessLevel === 'MODERATE') {
    score += 70 * COMPATIBILITY_WEIGHTS.cleanliness;
  } else {
    score += 35 * COMPATIBILITY_WEIGHTS.cleanliness;
  }

  // 4. Diet Preference (15%)
  if (myPref.dietPreference === otherPref.dietPreference || myPref.dietPreference === 'ANY' || otherPref.dietPreference === 'ANY') {
    score += 100 * COMPATIBILITY_WEIGHTS.diet;
  } else {
    score += 55 * COMPATIBILITY_WEIGHTS.diet;
  }

  // 5. Hobby / Interests (15%)
  if (myPref.hobbyInterest === otherPref.hobbyInterest) {
    score += 100 * COMPATIBILITY_WEIGHTS.hobby;
  } else {
    score += 65 * COMPATIBILITY_WEIGHTS.hobby;
  }

  return Math.min(99, Math.round(score));
}

// Get student's roommate survey & allotment
router.get('/preference', authenticateToken, async (req, res) => {
  try {
    const pref = await prisma.roommatePreference.findUnique({
      where: { studentId: req.user.id }
    });

    const allotment = await prisma.roomAllotment.findUnique({
      where: { studentId: req.user.id }
    });

    res.json({ preference: pref, allotment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roommate preferences' });
  }
});

// Save or update roommate survey
router.post('/preference', authenticateToken, async (req, res) => {
  try {
    const { sleepSchedule, studyHabit, cleanlinessLevel, dietPreference, hobbyInterest, acPreference, bioNotes } = req.body;

    const pref = await prisma.roommatePreference.upsert({
      where: { studentId: req.user.id },
      update: {
        sleepSchedule: sleepSchedule || 'NIGHT_OWL',
        studyHabit: studyHabit || 'QUIET_STUDY',
        cleanlinessLevel: cleanlinessLevel || 'STRICT_NEAT',
        dietPreference: dietPreference || 'PURE_VEG',
        hobbyInterest: hobbyInterest || 'CODING',
        acPreference: acPreference || 'AC_COOL',
        bioNotes: bioNotes || ''
      },
      create: {
        studentId: req.user.id,
        sleepSchedule: sleepSchedule || 'NIGHT_OWL',
        studyHabit: studyHabit || 'QUIET_STUDY',
        cleanlinessLevel: cleanlinessLevel || 'STRICT_NEAT',
        dietPreference: dietPreference || 'PURE_VEG',
        hobbyInterest: hobbyInterest || 'CODING',
        acPreference: acPreference || 'AC_COOL',
        bioNotes: bioNotes || ''
      }
    });

    res.json(pref);
  } catch (error) {
    console.error('Save Preference Error:', error);
    res.status(500).json({ error: 'Failed to save roommate preferences' });
  }
});

// Calculate compatibility matches with other students
router.get('/matches', authenticateToken, async (req, res) => {
  try {
    let myPref = await prisma.roommatePreference.findUnique({
      where: { studentId: req.user.id }
    });

    // If student hasn't filled survey yet, provide default fallback
    if (!myPref) {
      myPref = {
        sleepSchedule: 'NIGHT_OWL',
        studyHabit: 'QUIET_STUDY',
        cleanlinessLevel: 'STRICT_NEAT',
        dietPreference: 'PURE_VEG',
        hobbyInterest: 'CODING',
        acPreference: 'AC_COOL'
      };
    }

    // Candidate batchmates data
    const batchmates = [
      {
        id: 901,
        name: 'Devansh Gupta',
        mis: '112415018',
        branch: 'CSE',
        hostelBlock: 'Hostel Block A',
        allocatedRoom: 'A-204 (Bed 1)',
        roomNumber: 'A-204',
        bedNumber: 'Bed 1 (Door Side)',
        pref: { sleepSchedule: 'NIGHT_OWL', studyHabit: 'QUIET_STUDY', cleanlinessLevel: 'STRICT_NEAT', dietPreference: 'PURE_VEG', hobbyInterest: 'CODING', acPreference: 'AC_COOL', bioNotes: 'Competitive programmer (Codeforces Candidate Master), loves quiet midnight coding sessions.' }
      },
      {
        id: 902,
        name: 'Aditya Joshi',
        mis: '112415024',
        branch: 'CSE',
        hostelBlock: 'Hostel Block A',
        allocatedRoom: 'A-202 (Bed 1)',
        roomNumber: 'A-202',
        bedNumber: 'Bed 1 (Door Side)',
        pref: { sleepSchedule: 'NIGHT_OWL', studyHabit: 'LIBRARY', cleanlinessLevel: 'MODERATE', dietPreference: 'ANY', hobbyInterest: 'CODING', acPreference: 'AC_COOL', bioNotes: 'Web dev and hackathon enthusiast. Friendly and likes team project discussions.' }
      },
      {
        id: 903,
        name: 'Tanmay Deshmukh',
        mis: '112415039',
        branch: 'ECE',
        hostelBlock: 'Hostel Block A',
        allocatedRoom: 'A-205 (Bed 1)',
        roomNumber: 'A-205',
        bedNumber: 'Bed 1 (Door Side)',
        pref: { sleepSchedule: 'EARLY_RISER', studyHabit: 'QUIET_STUDY', cleanlinessLevel: 'STRICT_NEAT', dietPreference: 'PURE_VEG', hobbyInterest: 'SPORTS_FITNESS', acPreference: 'NATURAL_AIR', bioNotes: 'Morning jogger and gym regular. Wakes up at 5:30 AM, quiet study in room.' }
      },
      {
        id: 904,
        name: 'Priyansh Sharma',
        mis: '112415052',
        branch: 'CSE',
        hostelBlock: 'Hostel Block A',
        allocatedRoom: 'A-201 (Bed 1)',
        roomNumber: 'A-201',
        bedNumber: 'Bed 1 (Door Side)',
        pref: { sleepSchedule: 'NIGHT_OWL', studyHabit: 'MUSIC_GROUP', cleanlinessLevel: 'MODERATE', dietPreference: 'NON_VEG', hobbyInterest: 'GAMING', acPreference: 'AC_COOL', bioNotes: 'Esports gamer (Valorant) and full-stack developer. Welcomes music lovers.' }
      }
    ];

    const matches = batchmates.map(b => {
      const score = calculateCompatibility(myPref, b.pref);
      const matchHighlights = [];
      if (myPref.sleepSchedule === b.pref.sleepSchedule) matchHighlights.push(`Both are ${b.pref.sleepSchedule.replace('_', ' ')}s`);
      if (myPref.studyHabit === b.pref.studyHabit) matchHighlights.push(`Matching Study Habit: ${b.pref.studyHabit.replace('_', ' ')}`);
      if (myPref.cleanlinessLevel === b.pref.cleanlinessLevel) matchHighlights.push(`Cleanliness aligned (${b.pref.cleanlinessLevel.replace('_', ' ')})`);
      if (myPref.dietPreference === b.pref.dietPreference) matchHighlights.push(`Dietary alignment (${b.pref.dietPreference.replace('_', ' ')})`);

      return {
        ...b,
        matchScore: score,
        matchHighlights
      };
    });

    matches.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      myPreference: myPref,
      matches
    });
  } catch (error) {
    console.error('Roommate Matches Error:', error);
    res.status(500).json({ error: 'Failed to calculate roommate matches' });
  }
});

// Get room allotment matrix
router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const studentAllotment = await prisma.roomAllotment.findUnique({
      where: { studentId: req.user.id }
    });

    // 2-Seater Rooms Grid for Block A
    const rooms = [
      {
        roomNumber: 'A-201',
        floor: '2nd Floor',
        hostelBlock: 'Hostel Block A',
        acType: 'Air Conditioned',
        bed1: { number: 'Bed 1 (Door)', occupant: 'Priyansh Sharma (MIS: 112415052)', occupied: true, matchScore: 78 },
        bed2: { number: 'Bed 2 (Window)', occupant: null, occupied: false },
        status: 'PARTIALLY_OCCUPIED'
      },
      {
        roomNumber: 'A-202',
        floor: '2nd Floor',
        hostelBlock: 'Hostel Block A',
        acType: 'Air Conditioned',
        bed1: { number: 'Bed 1 (Door)', occupant: 'Aditya Joshi (MIS: 112415024)', occupied: true, matchScore: 91 },
        bed2: { number: 'Bed 2 (Window)', occupant: null, occupied: false },
        status: 'PARTIALLY_OCCUPIED'
      },
      {
        roomNumber: 'A-203',
        floor: '2nd Floor',
        hostelBlock: 'Hostel Block A',
        acType: 'Air Conditioned',
        bed1: { number: 'Bed 1 (Door)', occupant: null, occupied: false },
        bed2: { number: 'Bed 2 (Window)', occupant: null, occupied: false },
        status: 'VACANT'
      },
      {
        roomNumber: 'A-204',
        floor: '2nd Floor',
        hostelBlock: 'Hostel Block A',
        acType: 'Air Conditioned',
        bed1: { number: 'Bed 1 (Door)', occupant: 'Devansh Gupta (MIS: 112415018)', occupied: true, matchScore: 96, isTopMatch: true },
        bed2: { number: 'Bed 2 (Window)', occupant: studentAllotment ? `${req.user.name} (You)` : null, occupied: Boolean(studentAllotment) },
        status: studentAllotment ? 'FULLY_OCCUPIED' : 'PARTIALLY_OCCUPIED',
        isRecommended: true
      },
      {
        roomNumber: 'A-205',
        floor: '2nd Floor',
        hostelBlock: 'Hostel Block A',
        acType: 'Non-AC Deluxe',
        bed1: { number: 'Bed 1 (Door)', occupant: 'Tanmay Deshmukh (MIS: 112415039)', occupied: true, matchScore: 82 },
        bed2: { number: 'Bed 2 (Window)', occupant: 'Rohan Mehra (MIS: 112415041)', occupied: true },
        status: 'FULLY_OCCUPIED'
      },
      {
        roomNumber: 'A-206',
        floor: '2nd Floor',
        hostelBlock: 'Hostel Block A',
        acType: 'Non-AC Deluxe',
        bed1: { number: 'Bed 1 (Door)', occupant: null, occupied: false },
        bed2: { number: 'Bed 2 (Window)', occupant: null, occupied: false },
        status: 'VACANT'
      }
    ];

    res.json({
      studentAllotment,
      rooms
    });
  } catch (error) {
    console.error('Rooms Error:', error);
    res.status(500).json({ error: 'Failed to fetch room matrix' });
  }
});

// Allot room and bed
router.post('/allot', authenticateToken, async (req, res) => {
  try {
    const { hostelBlock, roomNumber, bedNumber } = req.body;
    if (!roomNumber || !bedNumber) {
      return res.status(400).json({ error: 'Room and Bed number are required' });
    }

    const allotment = await prisma.roomAllotment.upsert({
      where: { studentId: req.user.id },
      update: {
        hostelBlock: hostelBlock || 'Hostel Block A',
        roomNumber,
        bedNumber,
        status: 'CONFIRMED'
      },
      create: {
        studentId: req.user.id,
        hostelBlock: hostelBlock || 'Hostel Block A',
        roomNumber,
        bedNumber,
        status: 'CONFIRMED'
      }
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        hostelBlock: hostelBlock || 'Hostel Block A',
        roomNumber,
        bedNumber
      }
    });

    res.json(allotment);
  } catch (error) {
    console.error('Allot Error:', error);
    res.status(500).json({ error: 'Failed to confirm room allotment' });
  }
});

export default router;
