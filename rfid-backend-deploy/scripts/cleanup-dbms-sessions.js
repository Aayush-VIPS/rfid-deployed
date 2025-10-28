// Clean up and create a new session for MCA101 (DBMS) with correct attendance data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAndCreateSession() {
  try {
    // Get subject instance for DBMS
    const subjectInst = await prisma.subjectInstance.findFirst({
      where: {
        subject: { code: 'MCA101' },
        sectionId: '68d168361600e44cc2dae94d'
      },
      include: {
        subject: true,
        section: true,
        faculty: true
      }
    });

    if (!subjectInst) {
      console.log('No subject instance found for DBMS');
      return;
    }

    console.log('Found subject instance:', {
      id: subjectInst.id,
      subjectName: subjectInst.subject.name,
      sectionName: subjectInst.section.name,
      facultyName: subjectInst.faculty.name
    });

    // Create new session
    const newSession = await prisma.classSession.create({
      data: {
        subjectInstId: subjectInst.id,
        teacherId: subjectInst.facultyId,
        startAt: new Date('2025-09-24T14:45:00Z'),
        endAt: new Date('2025-09-24T16:15:00Z'),
        isClosed: true
      }
    });

    console.log('Created new session:', newSession);

    // Get all students in the section
    const students = await prisma.student.findMany({
      where: {
        sectionId: '68d168361600e44cc2dae94d'
      }
    });

    console.log(`Found ${students.length} students in section`);

    // List of enrollment numbers that were present (from attendance_session_report_68d25d7524e8bafaf12e6b04.xlsx)
    const presentEnrollments = [
      '00117704425', // Roshan
      '00417704425', // UJJWAL SINGH
      '01017704425', // Arjun Sharma
      '01317704425', // Silky
      '01417704425', // Harsimar Kaur
      '01517704425', // Kuljot Singh
      '03017704425', // Sai Abhinav
      '04017704425', // Shubham Nainwal
      '04317704425', // Deepanshu saxena
      '04917704425', // Shekhar Chhabra
      '05017704425', // Prabhneet Singh Sethi
      '06317704425', // Aarushi
      '06717704425', // Ansh Mongia
      '07217704425', // Hardik Sharma
      '07317704425', // RAJNIKANT UPADHYAY
      '07517704425', // Aryan sharma
      '07717704425', // Yash Bhartari
      '08417704425', // Shivam jain
      '08517704425', // Harsh Mathur
      '08817704425', // Kartik
      '08917704425', // Roopina Girotra
      '09117704425', // Deepesh Chauhan
      '09217704425', // Jamir uddin khan
      '09717704425', // Harshit Gupta
      '10217704425', // Pranav Verma
      '10517704425', // Diya Arora
      '13417704425', // RAKESH KUMAR BEHERA
      '13517704425', // Khushi Aggarwal
      '13817704425', // Ritika Thakur
      '14317704425', // Garima Sharma
      '14417704425', // Shivam
      '16017704425', // Ekansh verma
      '16117704425', // Drishti jain
      '16317704425', // Chiraag sharma
      '16417704425', // Ashad Hussain
      '16517704425', // Kshitiz Goel
      '16617704425', // Tarini Grover
      '16717704425', // Ayan Lal
      '16917704425', // Gaganpreet Kaur
      '17817704425', // Priyanka Gulati
      '17917704425', // Neha Tyagi
      '18317704425', // Kashish Rathore
      '18517704425', // AshmitTanwar
      '18917704425', // Anjali Gupta
      '19017704425', // Krishnangshu Banerji
      '19217704425', // Nishant Singh
      '12517704425', // BHARAT SHIVMAM POPLI
      '12717704425'  // Gaurav Ahlawat
    ];

    // Get first device ID for attendance logs
    const device = await prisma.device.findFirst();
    if (!device) {
      throw new Error('No device found in the system');
    }

    // Create attendance logs for ALL students in a single session
    for (const student of students) {
      const isPresent = presentEnrollments.includes(student.enrollmentNo);
      await prisma.attendanceLog.create({
        data: {
          status: isPresent ? 'PRESENT' : 'ABSENT',
          timestamp: isPresent ? new Date('2025-09-24T15:00:00Z') : new Date('2025-09-24T14:45:00Z'),
          student: {
            connect: {
              id: student.id
            }
          },
          session: {
            connect: {
              id: newSession.id
            }
          },
          device: {
            connect: {
              id: device.id
            }
          }
        }
      });
    }

    console.log('Created attendance logs for all students');
    console.log('Done!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAndCreateSession();