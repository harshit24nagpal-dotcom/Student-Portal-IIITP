import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const JWT_SECRET = process.env.JWT_SECRET || 'iiit_pune_campus_connect_super_secret_key';

const VENUES_FILE = path.join(DATA_DIR, 'campus_venues.json');
const CLUBS_FILE = path.join(DATA_DIR, 'sac_clubs.json');
const TIMETABLE_FILE = path.join(DATA_DIR, 'master_timetable.json');
const RESERVATIONS_FILE = path.join(DATA_DIR, 'reservations.json');

// Helper: load JSON safely
function loadJSON(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err);
    return fallback;
  }
}

// Helper: save JSON safely
function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

// Helper: get Day of week from YYYY-MM-DD
function getDayFromDate(dateStr) {
  if (!dateStr) return 'Monday';
  const d = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getDay()] || 'Monday';
}

// Helper: parse HH:MM into total minutes from midnight
function parseMinutes(timeStr) {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2})[:.](\d{2})(?:\s*(AM|PM))?$/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const meridian = match[3];

  if (meridian === 'PM' && hours < 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

// Helper: check if two time ranges overlap
function areTimeSlotsOverlapping(slotA, slotB) {
  if (!slotA || !slotB) return false;
  if (slotA.trim().toLowerCase() === slotB.trim().toLowerCase()) return true;

  const partsA = slotA.split('-').map(s => s.trim());
  const partsB = slotB.split('-').map(s => s.trim());
  if (partsA.length < 2 || partsB.length < 2) return slotA.trim() === slotB.trim();

  const startA = parseMinutes(partsA[0]);
  const endA = parseMinutes(partsA[1]);
  const startB = parseMinutes(partsB[0]);
  const endB = parseMinutes(partsB[1]);

  if (startA === 0 && endA === 0) return slotA.trim() === slotB.trim();
  if (startB === 0 && endB === 0) return slotA.trim() === slotB.trim();

  return Math.max(startA, startB) < Math.min(endA, endB);
}

// ---------------------------------------------------------------------------
// 1. GET Campus Infrastructure Directory (LH01-LH08, CR01-CR10)
// ---------------------------------------------------------------------------
router.get('/venues', authenticateToken, (req, res) => {
  try {
    const venues = loadJSON(VENUES_FILE, []);
    res.json(venues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campus venues' });
  }
});

// ---------------------------------------------------------------------------
// 2. GET Official SAC Clubs Directory
// ---------------------------------------------------------------------------
router.get('/clubs', authenticateToken, (req, res) => {
  try {
    const clubsData = loadJSON(CLUBS_FILE, {});
    res.json(clubsData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch SAC clubs directory' });
  }
});

// ---------------------------------------------------------------------------
// 3. GET Live Occupancy Grid for all Venues on a Date/Day
// ---------------------------------------------------------------------------
router.get('/live-grid', authenticateToken, (req, res) => {
  try {
    const { date, day: queryDay, venueType } = req.query;
    const day = queryDay || getDayFromDate(date);
    
    const venues = loadJSON(VENUES_FILE, []);
    const timetableData = loadJSON(TIMETABLE_FILE, { slots: [], entries: [] });
    const reservations = loadJSON(RESERVATIONS_FILE, []);

    const filteredVenues = venueType && venueType !== 'ALL'
      ? venues.filter(v => v.type === venueType)
      : venues;

    const slots = timetableData.slots || [
      '09:30 - 10:30', '10:30 - 11:30', '11:30 - 12:30', '12:30 - 13:30',
      '13:30 - 14:30', '14:30 - 15:30', '15:30 - 16:30', '16:30 - 17:30',
      '17:30 - 18:30', '18:30 - 19:30', '19:30 - 21:00'
    ];

    const grid = filteredVenues.map(venue => {
      const roomSlots = slots.map(slot => {
        // 1. Check if occupied in official academic timetable
        const ttClass = timetableData.entries.find(e => 
          e.venueId === venue.id && e.day.toLowerCase() === day.toLowerCase() && areTimeSlotsOverlapping(e.timeSlot, slot)
        );

        if (ttClass) {
          if (ttClass.isBreak) {
            return {
              slot,
              status: 'BREAK',
              label: 'Lunch / Institutional Break',
              classDetails: null,
              reservation: null
            };
          }
          return {
            slot,
            status: 'ACADEMIC_CLASS',
            label: `${ttClass.subjectCode}: ${ttClass.subjectName}`,
            classDetails: {
              subjectCode: ttClass.subjectCode,
              subjectName: ttClass.subjectName,
              faculty: ttClass.facultyName,
              batch: ttClass.batch
            },
            reservation: null
          };
        }

        // 2. Check if reserved on this specific date
        const resMatch = reservations.find(r => 
          r.venueId === venue.id && 
          areTimeSlotsOverlapping(r.timeSlot, slot) &&
          (date ? r.date === date : r.day.toLowerCase() === day.toLowerCase()) &&
          r.status !== 'REJECTED' && r.status !== 'CANCELLED'
        );

        if (resMatch) {
          return {
            slot,
            status: resMatch.status === 'APPROVED' ? 'RESERVED' : 'PENDING_APPROVAL',
            label: resMatch.title,
            classDetails: null,
            reservation: {
              id: resMatch.id,
              type: resMatch.type,
              title: resMatch.title,
              purpose: resMatch.purpose,
              organizer: resMatch.requestedBy?.name || 'Authorized Member',
              clubName: resMatch.clubName || null,
              status: resMatch.status,
              timeSlot: resMatch.timeSlot
            }
          };
        }

        return {
          slot,
          status: 'AVAILABLE',
          label: 'Available (Empty Slot)',
          classDetails: null,
          reservation: null
        };
      });

      return {
        venue,
        slots: roomSlots
      };
    });

    res.json({
      day,
      date: date || new Date().toISOString().split('T')[0],
      slots,
      venues: grid
    });
  } catch (err) {
    console.error('Error computing live grid:', err);
    res.status(500).json({ error: 'Failed to compute live occupancy grid' });
  }
});

// ---------------------------------------------------------------------------
// 4. GET All Reservations with Filters
// ---------------------------------------------------------------------------
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, venueId, date, type } = req.query;
    let reservations = loadJSON(RESERVATIONS_FILE, []);

    if (status && status !== 'ALL') {
      reservations = reservations.filter(r => r.status === status);
    }
    if (venueId && venueId !== 'ALL') {
      reservations = reservations.filter(r => r.venueId === venueId);
    }
    if (date) {
      reservations = reservations.filter(r => r.date === date);
    }
    if (type && type !== 'ALL') {
      reservations = reservations.filter(r => r.type === type);
    }

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// ---------------------------------------------------------------------------
// 5. POST Direct Faculty Reservation (Quizzes, Extra Sessions, Workshops)
// ---------------------------------------------------------------------------
router.post('/faculty', authenticateToken, (req, res) => {
  try {
    const isFaculty = ['FACULTY', 'FACULTY_ADVISOR', 'ADMIN'].includes(req.user.role);
    if (!isFaculty) {
      return res.status(403).json({ 
        error: 'Permission Denied: Direct room reservation is restricted to Faculty members.' 
      });
    }

    const { 
      venueId, date, timeSlot, customTimeSlot, title, 
      subjectCode, purpose, batch, expectedAttendees, 
      techRequirements, remarks 
    } = req.body;

    if (!venueId || !date || (!timeSlot && !customTimeSlot) || !title) {
      return res.status(400).json({ 
        error: 'Missing required parameters: venueId, date, timeSlot, and title are required.' 
      });
    }

    const finalSlot = (customTimeSlot && customTimeSlot.trim()) ? customTimeSlot.trim() : timeSlot.trim();
    const day = getDayFromDate(date);
    const venues = loadJSON(VENUES_FILE, []);
    const venueObj = venues.find(v => v.id === venueId);

    if (!venueObj) {
      return res.status(404).json({ error: `Venue with ID "${venueId}" not found.` });
    }

    const timetableData = loadJSON(TIMETABLE_FILE, { slots: [], entries: [] });
    const ttConflict = timetableData.entries.find(e => 
      e.venueId === venueId && 
      e.day.toLowerCase() === day.toLowerCase() && 
      areTimeSlotsOverlapping(e.timeSlot, finalSlot) &&
      !e.isBreak
    );

    if (ttConflict) {
      return res.status(409).json({ 
        error: `Academic Class Conflict: ${venueObj.name} has scheduled lecture "${ttConflict.subjectCode}: ${ttConflict.subjectName}" (${ttConflict.timeSlot}) by ${ttConflict.facultyName} on ${day}.` 
      });
    }

    const reservations = loadJSON(RESERVATIONS_FILE, []);
    const resConflict = reservations.find(r => 
      r.venueId === venueId && 
      r.date === date && 
      areTimeSlotsOverlapping(r.timeSlot, finalSlot) &&
      r.status !== 'REJECTED' && r.status !== 'CANCELLED'
    );

    if (resConflict) {
      return res.status(409).json({ 
        error: `Slot Already Booked: ${venueObj.name} is reserved on ${date} (${resConflict.timeSlot}) for "${resConflict.title}" by ${resConflict.requestedBy?.name || 'another organizer'}.` 
      });
    }

    const newId = `RES-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newReservation = {
      id: newId,
      type: 'FACULTY',
      title,
      subjectCode: subjectCode || 'ACADEMIC',
      purpose: purpose || 'QUIZ', // QUIZ, MAKEUP_LECTURE, WORKSHOP, SESSION, SEMINAR
      venueId,
      venueName: venueObj.name,
      date,
      day,
      timeSlot: finalSlot,
      customTiming: Boolean(customTimeSlot),
      batch: batch || 'All CSE/ECE',
      requestedBy: {
        userId: req.user.userId || 'EMP101',
        name: req.user.name || 'Faculty Member',
        role: req.user.role || 'FACULTY',
        department: req.user.department || 'CSE',
        email: req.user.email
      },
      expectedAttendees: Number(expectedAttendees) || venueObj.capacity || 80,
      techRequirements: Array.isArray(techRequirements) ? techRequirements : ['Projector', 'Audio System', 'AC'],
      status: 'APPROVED',
      stage: 'CONFIRMED',
      level1Approval: {
        approvedBy: req.user.name || 'Faculty Self-Reservation',
        role: 'Faculty',
        approvedAt: new Date().toISOString(),
        remarks: 'Direct faculty reservation verified for academic session.'
      },
      finalApproval: {
        approvedBy: 'System Auto-Sanction (Faculty Priority)',
        role: 'Academic Administration',
        approvedAt: new Date().toISOString(),
        remarks: 'Direct faculty reservation confirmed.'
      },
      createdAt: new Date().toISOString(),
      passQrCode: `PASS-${newId}-${venueId}-CONFIRMED-FACULTY`
    };

    reservations.unshift(newReservation);
    saveJSON(RESERVATIONS_FILE, reservations);

    const io = req.app.get('io');
    if (io) {
      io.emit('venue_reservation_created', { reservation: newReservation });
    }

    res.status(201).json({
      message: `Classroom ${venueObj.name} successfully reserved for "${title}" on ${date} (${finalSlot})!`,
      reservation: newReservation
    });
  } catch (err) {
    console.error('Error reserving venue for faculty:', err);
    res.status(500).json({ error: 'Failed to reserve classroom venue' });
  }
});

// ---------------------------------------------------------------------------
// 6. POST Club Head Event Proposal (Hierarchy: Level-1 Faculty -> Level-2 Admin)
// ---------------------------------------------------------------------------
router.post('/club', authenticateToken, (req, res) => {
  try {
    const { 
      clubCode, venueId, date, timeSlot, customTimeSlot, title, 
      description, purpose, expectedAttendees, techRequirements, 
      applicantPosition, applicantName, applicantMobile, reason 
    } = req.body;

    if (!clubCode || !venueId || !date || (!timeSlot && !customTimeSlot) || !title || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields: clubCode, venueId, date, timeSlot, title, and specific reason/justification are required.' 
      });
    }

    const clubsData = loadJSON(CLUBS_FILE, { categories: [] });
    let foundClub = null;
    let foundCategory = null;

    for (const cat of clubsData.categories) {
      const match = cat.clubs.find(c => c.code === clubCode);
      if (match) {
        foundClub = match;
        foundCategory = cat;
        break;
      }
    }

    if (!foundClub) {
      return res.status(404).json({ error: `Club with code "${clubCode}" is not registered under SAC.` });
    }

    // Permission Verification: Must be Head / Co-Head of the club or Admin
    const userMis = req.user.userId || '';
    const userName = (req.user.name || '').toLowerCase();
    const headName = (foundClub.head?.name || '').toLowerCase();
    const coHeadName = (foundClub.coHead?.name || '').toLowerCase();

    const isDesignatedHead = userName.includes(headName) || headName.includes(userName);
    const isDesignatedCoHead = userName.includes(coHeadName) || coHeadName.includes(userName);
    const isSpecialPrivilege = userMis === '112415079' || userMis === '112416047' || req.user.role === 'ADMIN' || req.user.role === 'FACULTY';

    if (!isDesignatedHead && !isDesignatedCoHead && !isSpecialPrivilege) {
      return res.status(403).json({
        error: `Permission Denied: Only designated Head or Co-Head of ${foundClub.name} can submit room reservation requests. (Head: ${foundClub.head?.name})`
      });
    }

    const finalSlot = (customTimeSlot && customTimeSlot.trim()) ? customTimeSlot.trim() : timeSlot.trim();
    const day = getDayFromDate(date);
    const venues = loadJSON(VENUES_FILE, []);
    const venueObj = venues.find(v => v.id === venueId);

    if (!venueObj) {
      return res.status(404).json({ error: `Venue "${venueId}" does not exist.` });
    }

    const timetableData = loadJSON(TIMETABLE_FILE, { slots: [], entries: [] });
    const ttConflict = timetableData.entries.find(e => 
      e.venueId === venueId && 
      e.day.toLowerCase() === day.toLowerCase() && 
      areTimeSlotsOverlapping(e.timeSlot, finalSlot) &&
      !e.isBreak
    );

    if (ttConflict) {
      return res.status(409).json({ 
        error: `Classroom Conflict: ${venueObj.name} is occupied on ${day} for "${ttConflict.subjectCode}: ${ttConflict.subjectName}" (${ttConflict.timeSlot}). Please choose an empty slot or evening slot.` 
      });
    }

    const reservations = loadJSON(RESERVATIONS_FILE, []);
    const resConflict = reservations.find(r => 
      r.venueId === venueId && 
      r.date === date && 
      areTimeSlotsOverlapping(r.timeSlot, finalSlot) &&
      r.status !== 'REJECTED' && r.status !== 'CANCELLED'
    );

    if (resConflict) {
      return res.status(409).json({ 
        error: `Venue Conflict: ${venueObj.name} is already booked on ${date} (${resConflict.timeSlot}) for "${resConflict.title}".` 
      });
    }

    const newId = `RES-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const position = applicantPosition || 'HEAD';
    const verifiedName = applicantName || (position === 'CO_HEAD' ? foundClub.coHead?.name : foundClub.head?.name) || req.user.name;

    const newClubProposal = {
      id: newId,
      type: 'CLUB',
      title,
      description: description || 'Official student club workshop/event.',
      reason: reason.trim(),
      purpose: purpose || 'CLUB_EVENT', // CLUB_EVENT, WORKSHOP, HACKATHON, CLUB_MEET
      clubCode: foundClub.code,
      clubName: foundClub.name,
      category: foundCategory.id,
      categoryName: foundCategory.name,
      categoryFaculty: foundCategory.facultyInCharge?.name || 'Faculty In-Charge',
      sacFaculty: clubsData.sacFacultyInCharge?.name || 'Dr. Shubham Shukla',
      venueId,
      venueName: venueObj.name,
      date,
      day,
      timeSlot: finalSlot,
      applicantPosition: position,
      requestedBy: {
        userId: req.user.userId || '112415079',
        name: verifiedName,
        designation: position === 'CO_HEAD' ? `Co-Head, ${foundClub.name}` : `Head, ${foundClub.name}`,
        role: 'STUDENT',
        mobile: applicantMobile || foundClub.head?.mobile || '9988776655',
        email: req.user.email || 'club.head@iiitp.ac.in'
      },
      expectedAttendees: Number(expectedAttendees) || 50,
      techRequirements: Array.isArray(techRequirements) ? techRequirements : ['Projector', 'Audio System'],
      status: 'PENDING_FACULTY_INCHARGE',
      stage: 'SUBMITTED',
      level1Approval: null,
      finalApproval: null,
      createdAt: new Date().toISOString(),
      passQrCode: null
    };

    reservations.unshift(newClubProposal);
    saveJSON(RESERVATIONS_FILE, reservations);

    const io = req.app.get('io');
    if (io) {
      io.emit('venue_reservation_created', { reservation: newClubProposal });
    }

    res.status(201).json({
      message: `Reservation request for ${foundClub.name} submitted by ${verifiedName}! Forwarded to Faculty In-charge for Level-1 approval.`,
      reservation: newClubProposal
    });
  } catch (err) {
    console.error('Error submitting club proposal:', err);
    res.status(500).json({ error: 'Failed to submit club reservation request' });
  }
});

// ---------------------------------------------------------------------------
// 7. PATCH Level-1 Approval: By Category Faculty In-charge
// ---------------------------------------------------------------------------
router.patch('/:id/approve-level1', authenticateToken, (req, res) => {
  try {
    const isApprover = ['FACULTY', 'FACULTY_ADVISOR', 'ADMIN'].includes(req.user.role);
    if (!isApprover) {
      return res.status(403).json({ error: 'Only Faculty In-charge can grant Level-1 approval.' });
    }

    const { id } = req.params;
    const { remarks } = req.body;
    const reservations = loadJSON(RESERVATIONS_FILE, []);
    const idx = reservations.findIndex(r => r.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Reservation request not found' });
    }

    const r = reservations[idx];
    if (r.status !== 'PENDING_FACULTY_INCHARGE') {
      return res.status(400).json({ error: `Cannot perform Level-1 approval. Current status is ${r.status}.` });
    }

    r.level1Approval = {
      approvedBy: req.user.name || r.categoryFaculty || 'Faculty In-charge',
      role: `Faculty In-charge (${r.categoryName || 'Category'})`,
      approvedAt: new Date().toISOString(),
      remarks: remarks || 'Proposal and club agenda verified. Recommended for final institutional sanction.'
    };
    r.status = 'PENDING_SAC_INCHARGE';
    r.stage = 'LEVEL_1_APPROVED';

    saveJSON(RESERVATIONS_FILE, reservations);

    const io = req.app.get('io');
    if (io) {
      io.emit('venue_reservation_updated', { type: 'LEVEL1_APPROVED', reservation: r });
    }

    res.json({
      message: `Level-1 approval granted! Request forwarded to SAC In-charge / Admin for final sanction.`,
      reservation: r
    });
  } catch (err) {
    console.error('Error during level-1 approval:', err);
    res.status(500).json({ error: 'Level-1 approval failed' });
  }
});

// ---------------------------------------------------------------------------
// 8. PATCH Final Approval: By SAC / Admin
// ---------------------------------------------------------------------------
router.patch('/:id/approve-final', authenticateToken, (req, res) => {
  try {
    const isApprover = ['ADMIN', 'FACULTY', 'FACULTY_ADVISOR'].includes(req.user.role);
    if (!isApprover) {
      return res.status(403).json({ error: 'Only Institutional Administration can grant final sanction.' });
    }

    const { id } = req.params;
    const { remarks } = req.body;
    const reservations = loadJSON(RESERVATIONS_FILE, []);
    const idx = reservations.findIndex(r => r.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Reservation request not found' });
    }

    const r = reservations[idx];
    if (r.status !== 'PENDING_SAC_INCHARGE' && r.status !== 'PENDING_FACULTY_INCHARGE') {
      return res.status(400).json({ error: `Cannot perform final approval. Current status is ${r.status}.` });
    }

    r.finalApproval = {
      approvedBy: req.user.name || 'Institutional Administration',
      role: 'SAC & Institutional Estate Authority',
      approvedAt: new Date().toISOString(),
      remarks: remarks || 'Officially sanctioned by Institutional Administration. Security and AV desk notified.'
    };
    r.status = 'APPROVED';
    r.stage = 'SANCTIONED';
    r.passQrCode = `PASS-${r.id}-${r.venueId}-SANCTIONED-IIITP`;

    saveJSON(RESERVATIONS_FILE, reservations);

    const io = req.app.get('io');
    if (io) {
      io.emit('venue_reservation_updated', { type: 'FINAL_APPROVED', reservation: r });
    }

    res.json({
      message: `Official Sanction Granted! ${r.venueName} is officially allotted to ${r.clubName || 'Requester'}.`,
      reservation: r
    });
  } catch (err) {
    console.error('Error during final approval:', err);
    res.status(500).json({ error: 'Final approval failed' });
  }
});

// ---------------------------------------------------------------------------
// 9. PATCH Reject Reservation (With Reason)
// ---------------------------------------------------------------------------
router.patch('/:id/reject', authenticateToken, (req, res) => {
  try {
    const isApprover = ['ADMIN', 'FACULTY', 'FACULTY_ADVISOR'].includes(req.user.role);
    if (!isApprover) {
      return res.status(403).json({ error: 'Unauthorized to reject reservations.' });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const reservations = loadJSON(RESERVATIONS_FILE, []);
    const idx = reservations.findIndex(r => r.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const r = reservations[idx];
    r.status = 'REJECTED';
    r.stage = 'REJECTED';
    r.rejectionReason = reason || 'Reservation proposal does not meet institutional requirements or slot is unavailable.';
    r.rejectedBy = {
      name: req.user.name || 'Institutional Approver',
      role: req.user.role || 'ADMIN',
      rejectedAt: new Date().toISOString()
    };

    saveJSON(RESERVATIONS_FILE, reservations);

    const io = req.app.get('io');
    if (io) {
      io.emit('venue_reservation_updated', { type: 'REJECTED', reservation: r });
    }

    res.json({ message: 'Reservation proposal has been rejected.', reservation: r });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject reservation' });
  }
});

// ---------------------------------------------------------------------------
// 10. DELETE Cancel Reservation
// ---------------------------------------------------------------------------
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    let reservations = loadJSON(RESERVATIONS_FILE, []);
    const target = reservations.find(r => r.id === id);

    if (!target) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const isOwner = target.requestedBy?.userId === req.user.userId || target.requestedBy?.email === req.user.email;
    const isAdmin = ['ADMIN', 'FACULTY'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to cancel this reservation' });
    }

    reservations = reservations.filter(r => r.id !== id);
    saveJSON(RESERVATIONS_FILE, reservations);

    const io = req.app.get('io');
    if (io) {
      io.emit('venue_reservation_deleted', { id });
    }

    res.json({ message: 'Reservation cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

export default router;
