import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Hostel, Complaints, and Lost & Found sample data...');

  // Find a student
  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' }
  });

  const warden = await prisma.user.findFirst({
    where: { role: 'HOSTEL_WARDEN' }
  });

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!student) {
    console.error('No student found in DB');
    return;
  }

  // 1. Seed In / Out Logs
  const existingLogs = await prisma.hostelInOutLog.count();
  if (existingLogs === 0) {
    await prisma.hostelInOutLog.createMany({
      data: [
        {
          studentId: student.id,
          direction: 'OUT',
          destination: 'Hinjawadi Phase 1 Market',
          reason: 'Medical prescription & stationery purchase',
          gateNumber: 'Gate 1 - Main Entrance',
          status: 'OUT',
          timestamp: new Date(Date.now() - 3600000 * 2) // 2 hours ago
        },
        {
          studentId: student.id,
          direction: 'IN',
          destination: 'Pune Railway Station',
          reason: 'Returned from weekend home visit',
          gateNumber: 'Gate 2 - East Gate',
          status: 'RETURNED',
          timestamp: new Date(Date.now() - 3600000 * 48) // 2 days ago
        }
      ]
    });
    console.log('Seeded In/Out logs');
  }

  // 2. Seed Leaves (helps Mess Headcount!)
  const existingLeaves = await prisma.hostelLeave.count();
  if (existingLeaves === 0) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await prisma.hostelLeave.createMany({
      data: [
        {
          studentId: student.id,
          leaveType: 'HOME_LEAVE',
          startDate: yesterday,
          endDate: tomorrow,
          startMeal: 'DINNER',
          endMeal: 'LUNCH',
          destination: 'Mumbai (Family Residence)',
          reason: 'Sister wedding function',
          parentContact: '+91 98220 54321',
          parentConsent: true,
          status: 'APPROVED',
          wardenRemarks: 'Verified with father via telephone. Outpass sanctioned.'
        },
        {
          studentId: student.id,
          leaveType: 'ACADEMIC_LEAVE',
          startDate: tomorrow,
          endDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          startMeal: 'BREAKFAST',
          endMeal: 'DINNER',
          destination: 'IIT Bombay TechFest',
          reason: 'Participating in National Robotics Competition',
          parentContact: '+91 98220 54321',
          parentConsent: true,
          status: 'PENDING',
          wardenRemarks: null
        }
      ]
    });
    console.log('Seeded Leaves');
  }

  // 3. Seed Hostel Problem Tickets with PROOF OF RESOLUTION
  const existingTickets = await prisma.hostelTicket.count();
  if (existingTickets === 0) {
    await prisma.hostelTicket.createMany({
      data: [
        {
          studentId: student.id,
          hostelBlock: 'Hostel Block A',
          roomNumber: 'A-204',
          category: 'PLUMBING',
          title: 'Washroom tap constant leaking',
          description: 'Sink tap in washroom 204 does not shut tightly, causing continuous dripping and water waste.',
          priority: 'HIGH',
          status: 'OPEN'
        },
        {
          studentId: student.id,
          hostelBlock: 'Hostel Block A',
          roomNumber: 'A-204',
          category: 'ELECTRICAL',
          title: 'Ceiling Fan Regulator stuck at max speed',
          description: 'Regulator knob is jammed; cannot lower fan speed during night study.',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS'
        },
        {
          studentId: student.id,
          hostelBlock: 'Hostel Block A',
          roomNumber: 'A-2nd Floor Corridor',
          category: 'WIFI_NETWORK',
          title: 'Corridor Wi-Fi AP 5GHz band dropping connection',
          description: 'Students on 2nd floor experience latency spikes and packet loss over IIITP-Hostel network.',
          priority: 'HIGH',
          status: 'RESOLVED',
          proofOfResolution: 'Replaced faulty Cisco Catalyst AP with new unit; tested 150 Mbps downlink throughput on IIITP-Hostel-5G network. Verified by Warden.',
          resolutionRemarks: 'Replacement completed and RF channel optimization applied.',
          resolvedBy: 'Technician Ramesh (Network & Infrastructure)',
          resolvedAt: new Date(Date.now() - 3600000 * 24)
        }
      ]
    });
    console.log('Seeded Hostel Tickets with Proof of Resolution');
  }

  // 4. Seed Complaints
  const existingComplaints = await prisma.complaint.count();
  if (existingComplaints === 0) {
    await prisma.complaint.createMany({
      data: [
        {
          studentId: student.id,
          category: 'MESS_FOOD_QUALITY',
          subject: 'Tea temperature and snack crispness in evening mess',
          description: 'Evening tea is often lukewarm by 5:45 PM and snacks run out quickly during mid-term exam days.',
          isAnonymous: true,
          status: 'UNDER_REVIEW',
          adminRemarks: 'Mess committee alerted. Caterer instructed to refill hot dispensers at 5:45 PM.'
        },
        {
          studentId: student.id,
          category: 'CAMPUS_SECURITY',
          subject: 'Flickering street lamp near Hostel walkway',
          description: 'Pathway between academic block and Hostel Block B is dim after 9:30 PM due to fixture flickering.',
          isAnonymous: false,
          status: 'IN_PROGRESS',
          adminRemarks: 'Estate office issued work order to electrical team.'
        },
        {
          studentId: student.id,
          category: 'GENERAL',
          subject: 'Library 3rd floor reading room air circulation',
          description: 'Need extra standing pedestal fans near row 4 windows.',
          isAnonymous: false,
          status: 'RESOLVED',
          adminRemarks: 'Two additional fans installed and calibrated.',
          resolvedAt: new Date(Date.now() - 86400000 * 3)
        }
      ]
    });
    console.log('Seeded Complaints');
  }

  // 5. Seed Lost & Found Items
  const existingLostFound = await prisma.lostAndFoundItem.count();
  if (existingLostFound === 0) {
    await prisma.lostAndFoundItem.createMany({
      data: [
        {
          type: 'LOST',
          title: 'Titan Silver Chronograph Watch',
          category: 'ELECTRONICS',
          description: 'Silver metal strap Titan analog watch. Lost near terminal 14 during CS301 laboratory session.',
          location: 'Computer Lab 2 (Academic Block)',
          date: '2026-10-18',
          contactInfo: 'Rohan / 112415079@cse.iiitp.ac.in',
          reportedById: student.id,
          status: 'OPEN'
        },
        {
          type: 'FOUND',
          title: 'Campus Student ID Card (MIS: 112415012)',
          category: 'ID_CARDS_WALLETS',
          description: 'Found blue lanyard ID card near water cooler in hostel dining mess.',
          location: 'Hostel Mess Dining Hall',
          date: '2026-10-19',
          contactInfo: 'Main Security Gate Room (Ext 101)',
          reportedById: student.id,
          status: 'OPEN'
        },
        {
          type: 'LOST',
          title: 'Casio fx-991EX Scientific Calculator',
          category: 'DOCUMENTS_BOOKS',
          description: 'Black body with white keys. Has a small IIITP logo sticker on rear battery door.',
          location: 'Lecture Hall 102',
          date: '2026-10-15',
          contactInfo: 'Contact +91 9826381867',
          reportedById: student.id,
          status: 'RESOLVED'
        }
      ]
    });
    console.log('Seeded Lost & Found Items');
  }

  console.log('All sample data successfully initialized!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
