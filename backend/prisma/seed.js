import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { eceStudents, cseStudents } from './studentsData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  // Delete in correct order to respect FK constraints
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
  
  await prisma.fileUpload.deleteMany({});
  await prisma.registrationVerification.deleteMany({});
  await prisma.registrationStatusHistory.deleteMany({});
  await prisma.registrationDocument.deleteMany({});
  await prisma.semesterRegistration.deleteMany({});
  
  await prisma.noDuesCertificate.deleteMany({});
  await prisma.noDuesDocument.deleteMany({});
  await prisma.noDuesStatusHistory.deleteMany({});
  await prisma.noDuesClearance.deleteMany({});
  await prisma.noDuesDepartment.deleteMany({});
  await prisma.noDuesApplication.deleteMany({});
  
  await prisma.attendanceAlert.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  await prisma.attendanceSession.deleteMany({});
  await prisma.courseEnrollment.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.systemConfig.deleteMany({});
  
  await prisma.user.deleteMany({});

  console.log('Seeding system configuration...');
  await prisma.systemConfig.createMany({
    data: [
      { key: 'ATTENDANCE_WARNING_THRESHOLD', value: '75', module: 'ATTENDANCE' },
      { key: 'ATTENDANCE_CRITICAL_THRESHOLD', value: '65', module: 'ATTENDANCE' },
      { key: 'REGISTRATION_DEADLINE', value: '2026-09-30', module: 'REGISTRATION' },
      { key: 'NO_DUES_ELIGIBLE_BATCH', value: '2020-2024', module: 'NO_DUES' }
    ]
  });

  const studentHashedPassword = bcrypt.hashSync('iiitp@2024', 10);
  const adminHashedPassword = bcrypt.hashSync('iiitp@123', 10);
  const defaultHashedPassword = bcrypt.hashSync('password', 10);

  console.log('Seeding staff and key roles...');
  
  // 1. Core Administrative & Verification Roles
  const admin = await prisma.user.create({
    data: {
      email: 'admin@iiitp.ac.in',
      name: 'Chief Security Admin',
      passwordHash: adminHashedPassword,
      role: 'ADMIN',
      contactNumber: '+91 9000000001',
      userId: 'EMP202',
      department: 'ADMINISTRATION'
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
      department: 'SECURITY'
    },
  });

  const facultyAnagha = await prisma.user.create({
    data: {
      email: 'anagha.khiste@iiitp.ac.in',
      name: 'Ms. Anagha Uday Khiste',
      passwordHash: defaultHashedPassword,
      role: 'FACULTY',
      contactNumber: '+91 9876543211',
      userId: 'EMP101',
      department: 'CSE'
    },
  });

  const facultyAdvisor = await prisma.user.create({
    data: {
      email: 'advisor.cse@iiitp.ac.in',
      name: 'Dr. Shrikant Salve (Faculty Advisor)',
      passwordHash: defaultHashedPassword,
      role: 'FACULTY_ADVISOR',
      contactNumber: '+91 9876543222',
      userId: 'EMP102',
      department: 'CSE'
    },
  });

  const hostelWarden = await prisma.user.create({
    data: {
      email: 'warden@iiitp.ac.in',
      name: 'Prof. Ramesh Patil (Hostel Warden)',
      passwordHash: defaultHashedPassword,
      role: 'HOSTEL_WARDEN',
      contactNumber: '+91 9876543333',
      userId: 'EMP103',
      department: 'HOSTEL'
    },
  });

  const clearanceOfficer = await prisma.user.create({
    data: {
      email: 'clearance.officer@iiitp.ac.in',
      name: 'Mr. S. K. Sharma (Clearance Officer)',
      passwordHash: defaultHashedPassword,
      role: 'CLEARANCE_OFFICER',
      contactNumber: '+91 9876543444',
      userId: 'EMP104',
      department: 'ACCOUNTS'
    },
  });

  // 2. Responders
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

  console.log('Seeding student directory...');
  
  // Batch Seed CSE Students (2024-2028)
  const seededStudents = [];
  for (const s of cseStudents) {
    const email = `${s.mis}@cse.iiitp.ac.in`;
    const userObj = await prisma.user.create({
      data: {
        email,
        name: s.name,
        passwordHash: studentHashedPassword,
        role: 'STUDENT',
        contactNumber: '+91 9988776655',
        userId: s.mis,
        department: 'CSE',
        programme: 'B.Tech CSE',
        batch: '2024-2028',
        semester: 3,
        section: parseInt(s.mis.slice(-3)) <= 82 ? 'Section A (CSE)' : 'Section B (CSE)',
        advisorId: facultyAdvisor.id,
        hostelBlock: 'Vindhyachal Boys Hostel (BH-1)',
      },
    });
    seededStudents.push(userObj);
  }

  // Batch Seed ECE Students (2024-2028)
  for (const s of eceStudents) {
    const email = `${s.mis}@ece.iiitp.ac.in`;
    const userObj = await prisma.user.create({
      data: {
        email,
        name: s.name,
        passwordHash: studentHashedPassword,
        role: 'STUDENT',
        contactNumber: '+91 9988776655',
        userId: s.mis,
        department: 'ECE',
        programme: 'B.Tech ECE',
        batch: '2024-2028',
        semester: 3,
        section: 'Section C (ECE)',
        advisorId: facultyAdvisor.id,
        hostelBlock: 'Sahyadri Girls Hostel (GH-1)',
      },
    });
    seededStudents.push(userObj);
  }

  // Seed Graduating Student (for No-Dues testing)
  const graduatingStudent = await prisma.user.create({
    data: {
      email: '112001001@cse.iiitp.ac.in',
      name: 'Aarav Verma (Graduating Finalist)',
      passwordHash: studentHashedPassword,
      role: 'STUDENT',
      contactNumber: '+91 9876500001',
      userId: '112001001',
      department: 'CSE',
      programme: 'B.Tech Computer Science & Engineering',
      batch: '2020-2024',
      semester: 8,
      isGraduating: true,
      advisorId: facultyAdvisor.id,
      hostelBlock: 'Vindhyachal Boys Hostel (BH-2)',
    }
  });

  // Make Harshit Nagpal also marked with advisor
  const harshit = seededStudents.find(s => s.email === '112415079@cse.iiitp.ac.in');

  console.log('Seeding Semester and Courses...');
  
  const currentSemester = await prisma.semester.create({
    data: {
      name: 'Odd Semester 2026-27',
      year: 2026,
      term: 'ODD',
      startDate: '2026-07-15',
      endDate: '2026-12-15',
      isActive: true,
    }
  });

  const courseLNO = await prisma.course.create({
    data: {
      code: 'LNO',
      name: 'Linear and Non-Linear Optimization',
      credits: 4,
      semesterId: currentSemester.id,
      section: 'Section A (CSE)',
      facultyId: facultyAnagha.id,
    }
  });

  const courseML = await prisma.course.create({
    data: {
      code: 'ML',
      name: 'Machine Learning',
      credits: 4,
      semesterId: currentSemester.id,
      section: 'Section A (CSE)',
      facultyId: facultyAnagha.id,
    }
  });

  const courseADS = await prisma.course.create({
    data: {
      code: 'ADS',
      name: 'Advanced Data Structures',
      credits: 3,
      semesterId: currentSemester.id,
      section: 'Section A (CSE)',
      facultyId: facultyAnagha.id,
    }
  });

  // Enroll Section A students in courses
  const sectionAStudents = seededStudents.filter(s => s.section === 'Section A (CSE)');
  for (const student of sectionAStudents) {
    await prisma.courseEnrollment.createMany({
      data: [
        { courseId: courseLNO.id, studentId: student.id },
        { courseId: courseML.id, studentId: student.id },
        { courseId: courseADS.id, studentId: student.id },
      ]
    });
  }

  // Seed Attendance Sessions & Records for Harshit
  if (harshit) {
    const dates = ['2026-08-20', '2026-08-22', '2026-08-25', '2026-08-27', '2026-09-01'];
    
    for (const d of dates) {
      const sessionML = await prisma.attendanceSession.create({
        data: {
          courseId: courseML.id,
          date: d,
          topic: `Lecture on ML - Date ${d}`,
          conductedById: facultyAnagha.id
        }
      });

      // Mark all students present except Harshit absent on 1 date
      for (const student of sectionAStudents) {
        const isAbsent = (student.id === harshit.id && d === '2026-08-27');
        await prisma.attendanceRecord.create({
          data: {
            sessionId: sessionML.id,
            courseId: courseML.id,
            studentId: student.id,
            status: isAbsent ? 'ABSENT' : 'PRESENT'
          }
        });
      }
    }
  }

  console.log('Seeding Responders & Emergency System...');

  const respSec = await prisma.responder.create({
    data: {
      userId: userSec1.id,
      role: 'Campus Security',
      latitude: 18.487700,
      longitude: 73.815600,
      availabilityStatus: 'AVAILABLE',
      rating: 4.8,
      responseTimeSum: 1200,
      resolvedCount: 10,
    },
  });

  for (const s of ['SECURITY', 'FIRE', 'ACCIDENT', 'OTHER', 'HARASSMENT']) {
    await prisma.responderSkill.create({
      data: { responderId: respSec.id, skill: s },
    });
  }

  const respMed = await prisma.responder.create({
    data: {
      userId: userMed1.id,
      role: 'Medical Team',
      latitude: 18.487100,
      longitude: 73.815000,
      availabilityStatus: 'AVAILABLE',
      rating: 4.9,
      responseTimeSum: 480,
      resolvedCount: 6,
    },
  });

  for (const s of ['MEDICAL', 'ACCIDENT', 'OTHER']) {
    await prisma.responderSkill.create({
      data: { responderId: respMed.id, skill: s },
    });
  }

  // Campus Locations & Contacts
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

  console.log('Seeding 15 IIIT Pune No-Dues Clearance Departments...');
  
  const noDuesDeptNames = [
    'Thesis Supervisor / Guide',
    'Library / Information Service',
    'Computers Labs',
    'Electronics Labs',
    'Head of Department',
    'Course Coordinator',
    'Training and Placement Cell',
    'Sports In-charge',
    'Store In-charge',
    'Server Room',
    'Hostel Warden / Hostel In-charge',
    'Security In-charge',
    'Examination Cell',
    'Accounts Section',
    'Academic Section'
  ];

  const createdDepts = [];
  for (let i = 0; i < noDuesDeptNames.length; i++) {
    const dept = await prisma.noDuesDepartment.create({
      data: {
        name: noDuesDeptNames[i],
        displayOrder: i + 1,
        officerId: clearanceOfficer.id,
        isActive: true,
      }
    });
    createdDepts.push(dept);
  }

  console.log('Seeding sample Semester Registrations & No-Dues Applications...');
  
  if (harshit) {
    // Semester Registration for Harshit (Pending Hostel Verification)
    const semReg = await prisma.semesterRegistration.create({
      data: {
        studentId: harshit.id,
        semesterId: currentSemester.id,
        status: 'WARDEN_REVIEW',
        submittedAt: new Date(),
        documents: {
          create: [
            {
              documentType: 'ERP_PROOF',
              documentName: 'ERP_Registration_Screenshot_112415079.pdf',
              filePath: '/uploads/demo_erp_proof.pdf',
              fileType: 'pdf',
              fileSize: 102400,
              status: 'PENDING'
            },
            {
              documentType: 'FEE_RECEIPT',
              documentName: 'Semester_3_Fee_Receipt_SBI.pdf',
              filePath: '/uploads/demo_fee_receipt.pdf',
              fileType: 'pdf',
              fileSize: 204800,
              status: 'PENDING'
            }
          ]
        },
        statusHistory: {
          create: {
            fromStatus: 'SUBMITTED',
            toStatus: 'WARDEN_REVIEW',
            changedBy: harshit.name,
            remarks: 'Submitted ERP Proof and Fee Receipt for 3rd Semester verification.'
          }
        }
      }
    });
  }

  // Seed No-Dues Application for Graduating Student
  if (graduatingStudent) {
    const noDuesApp = await prisma.noDuesApplication.create({
      data: {
        studentId: graduatingStudent.id,
        batch: '2020-2024',
        programme: graduatingStudent.programme,
        status: 'IN_PROGRESS',
        submittedAt: new Date(),
      }
    });

    // Create clearance items for each department
    for (let i = 0; i < createdDepts.length; i++) {
      const dept = createdDepts[i];
      // Mark first 4 departments APPROVED, rest PENDING
      const isApproved = i < 4;
      await prisma.noDuesClearance.create({
        data: {
          applicationId: noDuesApp.id,
          departmentId: dept.id,
          officerId: clearanceOfficer.id,
          status: isApproved ? 'APPROVED' : 'PENDING',
          amountDue: 0,
          remarks: isApproved ? 'Clearance verified and approved.' : null,
          actionAt: isApproved ? new Date() : null,
        }
      });
    }

    await prisma.noDuesStatusHistory.create({
      data: {
        applicationId: noDuesApp.id,
        fromStatus: 'SUBMITTED',
        toStatus: 'IN_PROGRESS',
        changedBy: graduatingStudent.name,
        remarks: 'No-dues clearance initiated for 2020-2024 batch graduation.'
      }
    });
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
