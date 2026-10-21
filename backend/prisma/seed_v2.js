import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Announcements, Placement Drives, and Roommate Allotment data...');

  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' }
  });

  if (!student) {
    console.error('No student found in DB');
    return;
  }

  // Update student CGPA & backlogs
  await prisma.user.update({
    where: { id: student.id },
    data: {
      cgpa: 8.65,
      activeBacklogs: 0,
      roomNumber: 'A-204',
      bedNumber: 'Bed 2 (Window Side)'
    }
  });

  // 1. ANNOUNCEMENTS
  const existingAnnouncements = await prisma.announcement.count();
  if (existingAnnouncements === 0) {
    await prisma.announcement.createMany({
      data: [
        {
          title: 'Navratri 9-Days Special Celebration: Traditional Dress Code & Garba Pass',
          content: 'In view of the auspicious Navratri festival (Oct 15 - Oct 23), students are permitted to wear cultural/traditional ethnic Indian dress codes during regular lecture hours. Evening Garba pass and Dandiya entry wristbands can be collected from Academic Wing counter.',
          portalType: 'ACADEMIC',
          category: 'DRESS_CODE',
          badgeText: 'Navratri Festive Dress Code',
          priority: 'HIGH',
          date: '2026-10-22',
          authorRole: 'Dean Academic Affairs'
        },
        {
          title: 'Odd Semester Mid-Term Examination Datesheet & Seating Matrix',
          content: 'The official Mid-Sem exam schedule for B.Tech CSE & ECE (Batch 2024-2028 & 2023-2027) is published. Examinations will be conducted across Hall 101-104 with strict attendance minimum (75%).',
          portalType: 'ACADEMIC',
          category: 'EXAM',
          badgeText: 'Exam Datesheet',
          priority: 'NORMAL',
          date: '2026-10-20',
          authorRole: 'Examination Cell'
        },
        {
          title: 'Smart India Hackathon (SIH 2026) College Internal Round',
          content: 'Teams submitted for SIH internal hackathon shortlisted for hardware & software evaluation. Review presentations on Oct 25 at 2:00 PM in Computing Lab 2.',
          portalType: 'ACADEMIC',
          category: 'CIRCULAR',
          badgeText: 'Hackathon Round',
          priority: 'NORMAL',
          date: '2026-10-18',
          authorRole: 'Innovation Council'
        },
        {
          title: "Special Navratri Festive Mess Menu & 30-Min Schedule Delay Notice",
          content: "Today's evening mess features a special Navratri celebration menu including Sabudana Vada, Kuttu Poori, Paneer Lababdar, Masala Chaas, and Kesari Kheer. Notice: Due to festive sweet preparations, dinner service is delayed by 30 mins (Dinner will be served from 08:15 PM to 10:15 PM instead of 07:45 PM).",
          portalType: 'HOSTEL',
          category: 'MESS_UPDATE',
          badgeText: 'Mess Delayed 30m • Festive Menu',
          priority: 'URGENT',
          date: '2026-10-22',
          authorRole: 'Chief Hostel Warden & Mess Committee'
        },
        {
          title: 'Navratri Garba Nights Curfew Extension to 11:30 PM',
          content: 'Hostel residents attending campus Garba grounds are granted curfew relaxation up to 11:30 PM from Oct 18 through Oct 23. Students must scan their digital ID card at Gate 1 upon return.',
          portalType: 'HOSTEL',
          category: 'FESTIVAL',
          badgeText: 'Curfew 11:30 PM',
          priority: 'HIGH',
          date: '2026-10-19',
          authorRole: 'Hostel Residence Council'
        },
        {
          title: 'Hostel Block A & B Solar Water Heater & RO Maintenance',
          content: 'Quarterly solar heating manifold service and RO drinking water filter maintenance will be conducted tomorrow between 10:00 AM and 01:00 PM. Hot water supply will resume by 2:00 PM.',
          portalType: 'HOSTEL',
          category: 'GENERAL',
          badgeText: 'Maintenance Notice',
          priority: 'NORMAL',
          date: '2026-10-17',
          authorRole: 'Estate Maintenance Team'
        }
      ]
    });
    console.log('Seeded Announcements');
  }

  // 2. PLACEMENT DRIVES
  const existingDrives = await prisma.placementDrive.count();
  if (existingDrives === 0) {
    const d1 = await prisma.placementDrive.create({
      data: {
        companyName: 'Google',
        role: 'Software Development Engineer (SDE-1)',
        type: 'FULL_TIME',
        ctc: '₹32.5 LPA (Base: ₹18 LPA + Stocks)',
        location: 'Bengaluru / Hyderabad',
        minCgpa: 8.0,
        allowedBranches: 'CSE,ECE',
        maxBacklogs: 0,
        eligibleBatch: '2024-2028',
        deadline: '2026-10-31',
        description: 'Google Cloud and Core Systems team hiring for backend and distributed systems infrastructure. Proficient in Data Structures, Algorithms, C++, Java, or Go.',
        selectionRounds: 'Resume Screen -> Online Coding Assessment (2 Qs) -> 3 Technical Video Rounds -> Googlyness / HR',
        status: 'ACTIVE'
      }
    });

    const d2 = await prisma.placementDrive.create({
      data: {
        companyName: 'Microsoft',
        role: 'Software Engineering Intern (Summer 2027)',
        type: 'INTERNSHIP',
        ctc: '₹1,25,000 / Month Stipend + Accommodation',
        location: 'Hyderabad / Noida / Bengaluru',
        minCgpa: 7.5,
        allowedBranches: 'CSE,ECE',
        maxBacklogs: 0,
        eligibleBatch: '2024-2028',
        deadline: '2026-11-05',
        description: 'Azure Developer Experience team hiring interns. Focus on Cloud Computing, Web Platforms, and AI Copilot services.',
        selectionRounds: 'Codility Online Assessment -> Technical Round 1 -> Technical Round 2 -> Hiring Manager Round',
        status: 'ACTIVE'
      }
    });

    const d3 = await prisma.placementDrive.create({
      data: {
        companyName: 'NVIDIA',
        role: 'Hardware & System Software Intern',
        type: 'INTERNSHIP',
        ctc: '₹1,10,000 / Month Stipend',
        location: 'Pune (Hinjawadi)',
        minCgpa: 8.2,
        allowedBranches: 'ECE,CSE',
        maxBacklogs: 0,
        eligibleBatch: '2024-2028',
        deadline: '2026-11-10',
        description: 'GPU Architecture and CUDA driver optimization team. Hands-on experience in Verilog, C/C++, Computer Architecture, and Linux kernel drivers.',
        selectionRounds: 'HackerRank Test (EDA/C++) -> Architecture Technical Round -> System Design -> HR Round',
        status: 'ACTIVE'
      }
    });

    const d4 = await prisma.placementDrive.create({
      data: {
        companyName: 'Goldman Sachs',
        role: 'Quantitative Analyst & Systems Engineer',
        type: 'FULL_TIME',
        ctc: '₹28.0 LPA',
        location: 'Bengaluru',
        minCgpa: 7.8,
        allowedBranches: 'CSE',
        maxBacklogs: 0,
        eligibleBatch: '2024-2028',
        deadline: '2026-10-28',
        description: 'Global Markets engineering division. High frequency trading platform development, low latency C++, Python for risk calculation.',
        selectionRounds: 'Aptitude & Coding Assessment -> Technical Round 1 -> Technical Round 2 -> HR Interview',
        status: 'ACTIVE'
      }
    });

    // Create an application for student
    await prisma.placementApplication.create({
      data: {
        driveId: d2.id,
        studentId: student.id,
        status: 'OA_CLEARED',
        interviewSlot: '2026-10-26 11:30 AM IST',
        interviewLink: 'https://teams.microsoft.com/l/meetup-join/iiitp-msft-drive-2026',
        remarks: 'Cleared Codility OA with 100% score (3/3 tasks solved). Technical Interview 1 scheduled.'
      }
    });

    console.log('Seeded Placement Drives & Applications');
  }

  // 3. ROOMMATE PREFERENCE & ALLOTMENT
  const pref = await prisma.roommatePreference.findUnique({
    where: { studentId: student.id }
  });

  if (!pref) {
    await prisma.roommatePreference.create({
      data: {
        studentId: student.id,
        sleepSchedule: 'NIGHT_OWL',
        studyHabit: 'QUIET_STUDY',
        cleanlinessLevel: 'STRICT_NEAT',
        dietPreference: 'PURE_VEG',
        hobbyInterest: 'CODING',
        acPreference: 'AC_COOL',
        bioNotes: 'Focused on competitive programming and open-source contributions. Usually awake till 2 AM coding with headphones.'
      }
    });

    await prisma.roomAllotment.create({
      data: {
        studentId: student.id,
        hostelBlock: 'Hostel Block A',
        roomNumber: 'A-204',
        bedNumber: 'Bed 2 (Window Side)',
        status: 'CONFIRMED'
      }
    });

    console.log('Seeded Roommate Preference & Room Allotment');
  }

  console.log('Seeding V2 successfully completed!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
