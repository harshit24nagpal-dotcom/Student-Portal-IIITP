import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { eceStudents, cseStudents } from './studentsData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  // Delete in correct order to avoid foreign key constraints
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.emergencyStatusHistory.deleteMany({});
  await prisma.emergencyLocationHistory.deleteMany({});
  await prisma.emergencyAssignment.deleteMany({});
  await prisma.emergencyRequest.deleteMany({});
  await prisma.responderSkill.deleteMany({});
  await prisma.responder.deleteMany({});
  await prisma.emergencyContact.deleteMany({});
  await prisma.campusLocation.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding database...');

  const studentHashedPassword = bcrypt.hashSync('iiitp@2024', 10);
  const adminHashedPassword = bcrypt.hashSync('iiitp@123', 10);
  const defaultHashedPassword = bcrypt.hashSync('password', 10);

  // 1. Batch Seed CSE Students (2024-2028)
  for (const s of cseStudents) {
    const email = `${s.mis}@cse.iiitp.ac.in`;
    await prisma.user.create({
      data: {
        email,
        name: s.name,
        passwordHash: studentHashedPassword,
        role: 'STUDENT',
        contactNumber: '+91 9988776655',
        userId: s.mis,
      },
    });
  }

  // 2. Batch Seed ECE Students (2024-2028)
  for (const s of eceStudents) {
    const email = `${s.mis}@ece.iiitp.ac.in`;
    await prisma.user.create({
      data: {
        email,
        name: s.name,
        passwordHash: studentHashedPassword,
        role: 'STUDENT',
        contactNumber: '+91 9988776655',
        userId: s.mis,
      },
    });
  }

  const faculty = await prisma.user.create({
    data: {
      email: 'anagha.khiste@iiitp.ac.in',
      name: 'Anagha Uday Khiste',
      passwordHash: defaultHashedPassword,
      role: 'FACULTY',
      contactNumber: '+91 9876543211',
      userId: 'EMP101',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@iiitp.ac.in',
      name: 'Chief Security Admin',
      passwordHash: adminHashedPassword,
      role: 'ADMIN',
      contactNumber: '+91 9000000001',
      userId: 'EMP202',
    },
  });

  const security = await prisma.user.create({
    data: {
      email: 'security@iiitp.ac.in',
      name: 'Security Head Room',
      passwordHash: adminHashedPassword,
      role: 'SECURITY',
      contactNumber: '+91 9000000002',
      userId: 'EMP203',
    },
  });

  // Users for Responders
  const userSec1 = await prisma.user.create({
    data: {
      email: 'security1@iiitp.ac.in',
      name: 'Officer Rajesh Patil',
      passwordHash: defaultHashedPassword,
      role: 'RESPONDER',
      contactNumber: '+91 9811223344',
      userId: 'EMP301',
    },
  });

  const userMed1 = await prisma.user.create({
    data: {
      email: 'medical1@iiitp.ac.in',
      name: 'Dr. Ananya Iyer',
      passwordHash: defaultHashedPassword,
      role: 'RESPONDER',
      contactNumber: '+91 9822334455',
      userId: 'EMP302',
    },
  });

  const userFac1 = await prisma.user.create({
    data: {
      email: 'faculty1@iiitp.ac.in',
      name: 'Prof. Ramesh Shah',
      passwordHash: defaultHashedPassword,
      role: 'RESPONDER',
      contactNumber: '+91 9833445566',
      userId: 'EMP303',
    },
  });

  const userVol1 = await prisma.user.create({
    data: {
      email: 'volunteer1@iiitp.ac.in',
      name: 'Kabir Mehta',
      passwordHash: defaultHashedPassword,
      role: 'RESPONDER',
      contactNumber: '+91 9844556677',
      userId: '2023BCS045',
    },
  });

  console.log('Users created.');

  // 2. Create Responders & Skills
  // Campus Coordinates Base: Lat 18.487700, Lng 73.815600 (Security Office)
  
  const respSec = await prisma.responder.create({
    data: {
      userId: userSec1.id,
      role: 'Campus Security',
      latitude: 18.487700, // Located at Security office
      longitude: 73.815600,
      availabilityStatus: 'AVAILABLE',
      rating: 4.8,
      responseTimeSum: 1200, // 20 mins total response
      resolvedCount: 10,
    },
  });

  const skillsSec = ['SECURITY', 'FIRE', 'ACCIDENT', 'OTHER', 'HARASSMENT'];
  for (const s of skillsSec) {
    await prisma.responderSkill.create({
      data: { responderId: respSec.id, skill: s },
    });
  }

  const respMed = await prisma.responder.create({
    data: {
      userId: userMed1.id,
      role: 'Medical Team',
      latitude: 18.487100, // Located at Medical Room
      longitude: 73.815000,
      availabilityStatus: 'AVAILABLE',
      rating: 4.9,
      responseTimeSum: 480,
      resolvedCount: 6,
    },
  });

  const skillsMed = ['MEDICAL', 'ACCIDENT', 'OTHER'];
  for (const s of skillsMed) {
    await prisma.responderSkill.create({
      data: { responderId: respMed.id, skill: s },
    });
  }

  const respFac = await prisma.responder.create({
    data: {
      userId: userFac1.id,
      role: 'Faculty Emergency Coordinator',
      latitude: 18.488200, // Located at Academic Block
      longitude: 73.816200,
      availabilityStatus: 'AVAILABLE',
      rating: 4.5,
      responseTimeSum: 900,
      resolvedCount: 3,
    },
  });

  const skillsFac = ['HARASSMENT', 'OTHER', 'SECURITY'];
  for (const s of skillsFac) {
    await prisma.responderSkill.create({
      data: { responderId: respFac.id, skill: s },
    });
  }

  const respVol = await prisma.responder.create({
    data: {
      userId: userVol1.id,
      role: 'Student Volunteer',
      latitude: 18.486200, // Located at Boys Hostel
      longitude: 73.815100,
      availabilityStatus: 'AVAILABLE',
      rating: 4.6,
      responseTimeSum: 300,
      resolvedCount: 2,
    },
  });

  const skillsVol = ['MEDICAL', 'OTHER', 'ACCIDENT'];
  for (const s of skillsVol) {
    await prisma.responderSkill.create({
      data: { responderId: respVol.id, skill: s },
    });
  }

  console.log('Responders and Skills seeded.');

  // 3. Seed Campus Locations
  const locations = [
    { name: 'Academic Block A', latitude: 18.488200, longitude: 73.816200, type: 'ACADEMIC' },
    { name: 'Main Gate & Security Hub', latitude: 18.488700, longitude: 73.816800, type: 'SECURITY' },
    { name: 'Boys Hostel (Vindhyachal)', latitude: 18.486200, longitude: 73.815100, type: 'HOSTEL' },
    { name: 'Girls Hostel (Sahyadri)', latitude: 18.486800, longitude: 73.814200, type: 'HOSTEL' },
    { name: 'Campus Medical Center', latitude: 18.487100, longitude: 73.815000, type: 'MEDICAL' },
    { name: 'Central Library & Admin', latitude: 18.487900, longitude: 73.815700, type: 'ACADEMIC' },
    { name: 'Emergency Assembly Point 1', latitude: 18.487500, longitude: 73.816400, type: 'ASSEMBLY' },
    { name: 'Emergency Exit East', latitude: 18.488000, longitude: 73.817000, type: 'EXIT' },
  ];

  for (const loc of locations) {
    await prisma.campusLocation.create({ data: loc });
  }

  console.log('Campus Locations seeded.');

  // 4. Seed Emergency Contacts
  const contacts = [
    { name: 'Main Security Control Room', number: '+91 20 2345 6789', department: 'Security' },
    { name: 'Campus Ambulance & Clinic', number: '+91 98765 43210', department: 'Medical' },
    { name: 'Faculty Emergency Head', number: '+91 98765 99999', department: 'Administration' },
    { name: 'Student Welfare & Support', number: '+91 98765 12345', department: 'Counseling' },
    { name: 'Anti-Ragging Hotline', number: '1800-180-5522', department: 'Safety Committee' },
    { name: 'Local Fire Station (Ambegaon)', number: '101', department: 'External Emergency' },
  ];

  for (const contact of contacts) {
    await prisma.emergencyContact.create({ data: contact });
  }
  console.log('Emergency Contacts seeded.');

  // 5. Seed Initial Attendance Records for Harshit Nagpal & Section A/B/C students
  const harshit = await prisma.user.findUnique({ where: { email: '112415079@cse.iiitp.ac.in' } });
  const facultyAnagha = await prisma.user.findUnique({ where: { email: 'anagha.khiste@iiitp.ac.in' } });

  if (harshit) {
    const sampleDates = ['2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-09-01'];
    const subjects = [
      { code: 'LNO', name: 'Linear and Non-Linear Optimization', faculty: 'Ms. Anagha Khiste', section: 'Section A (CSE)' },
      { code: 'ML', name: 'Machine Learning', faculty: 'Dr. Sunita Chaki', section: 'Section A (CSE)' },
      { code: 'ADS', name: 'Advanced Data Structures', faculty: 'Dr. Suraj Kumar', section: 'Section A (CSE)' },
      { code: 'SE', name: 'Software Engineering', faculty: 'Ms. Anupama Avan', section: 'Section A (CSE)' },
      { code: 'CNS', name: 'Cryptography and Network Security', faculty: 'Dr. Shrirang Shukla', section: 'Section A (CSE)' },
      { code: 'HCI', name: 'Human Computer Interaction', faculty: 'Dr. Shrikant Salve', section: 'Section A (CSE)' },
    ];

    for (const sub of subjects) {
      for (let i = 0; i < sampleDates.length; i++) {
        // Harshit is present in most classes, absent in 1
        const status = (sub.code === 'CNS' && i === 2) || (sub.code === 'HCI' && i === 4) ? 'ABSENT' : 'PRESENT';
        await prisma.attendanceRecord.create({
          data: {
            subjectCode: sub.code,
            subjectName: sub.name,
            section: sub.section,
            date: sampleDates[i],
            studentId: harshit.id,
            facultyId: facultyAnagha ? facultyAnagha.id : 1,
            facultyName: sub.faculty,
            status,
          },
        });
      }
    }
    console.log('Sample Attendance records seeded for Harshit Nagpal.');
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
