const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDBMSSessions() {
  try {
    // First get the subject instance directly
    const subjectInst = await prisma.subjectInst.findFirst({
      where: {
        subjectId: '68d168391600e44cc2dae961', // DBMS subject ID
        sectionId: '68d168361600e44cc2dae94d'  // Section ID
      }
    });

    if (!subjectInst) {
      console.log('Subject instance not found');
      return;
    }

    console.log('Found subject instance:', subjectInst);

    // Delete attendance logs for sessions of this subject instance
    const deletedLogs = await prisma.attendanceLog.deleteMany({
      where: {
        session: {
          subjectInstId: subjectInst.id
        }
      }
    });

    console.log(`Deleted ${deletedLogs.count} attendance logs for DBMS sessions`);

    // Delete sessions for this subject instance
    const deletedSessions = await prisma.classSession.deleteMany({
      where: {
        subjectInstId: subjectInst.id
      }
    });

    console.log(`Deleted ${deletedSessions.count} DBMS sessions`);

    // Create new session
    const newSession = await prisma.classSession.create({
      data: {
        subjectInstId: subjectInst.id,
        teacherId: '68d165641600e44cc2dae943',
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

    // List of enrollment numbers that were present
    const presentEnrollments = [
      '06317704425', // Aarushi
      '18917704425', // Anjali Gupta
      '06717704425', // Ansh Mongia
      '01017704425', // Arjun Sharma
      '07517704425', // Aryan sharma
      '16417704425', // Ashad Hussain
      '18517704425', // AshmitTanwar
      '16717704425', // Ayan Lal
      '12517704425', // BHARAT SHIVMAM POPLI
      '16317704425', // Chiraag sharma
      '04317704425', // Deepanshu saxena
      '09117704425', // Deepesh Chauhan
      '10517704425', // Diya Arora
      '16117704425', // Drishti jain
      '16017704425', // Ekansh verma
      '16917704425', // Gaganpreet Kaur
      '14317704425', // Garima Sharma
      '12717704425', // Gaurav Ahlawat
      '07217704425', // Hardik Sharma
      '08517704425', // Harsh Mathur
      '09717704425', // Harshit Gupta
      '01417704425', // Harsimar Kaur
      '09217704425', // Jamir uddin khan
      '08817704425', // Kartik
      '18317704425', // Kashish Rathore
      '13517704425', // Khushi Aggarwal
      '19017704425', // Krishnangshu Banerji
      '16517704425', // Kshitiz Goel
      '01517704425', // Kuljot Singh
      '17917704425'  // Neha Tyagi
    ];

    // Create attendance logs
    for (const student of students) {
      await prisma.attendanceLog.create({
        data: {
          studentId: student.id,
          sessionId: newSession.id,
          status: presentEnrollments.includes(student.enrollmentNo) ? 'PRESENT' : 'ABSENT',
          timestamp: presentEnrollments.includes(student.enrollmentNo) ? 
            new Date('2025-09-24T15:00:00Z') : null
        }
      });
    }

    console.log('Created attendance logs');
    console.log('Done!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDBMSSessions();