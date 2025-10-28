// Script to verify DBMS attendance
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAttendance() {
  try {
    // Get the latest DBMS session
    const session = await prisma.classSession.findFirst({
      where: {
        subjectInst: {
          subject: { code: 'MCA101' },
          sectionId: '68d168361600e44cc2dae94d'
        }
      },
      orderBy: {
        startAt: 'desc'
      },
      include: {
        subjectInst: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!session) {
      console.log('No DBMS session found');
      return;
    }

    console.log('Session details:', {
      id: session.id,
      subject: session.subjectInst.subject.name,
      startTime: session.startAt,
      endTime: session.endAt
    });

    // Get all attendance logs for this session
    const attendanceLogs = await prisma.attendanceLog.findMany({
      where: {
        sessionId: session.id
      },
      include: {
        student: true
      }
    });

    const presentCount = attendanceLogs.filter(log => log.status === 'PRESENT').length;
    const absentCount = attendanceLogs.filter(log => log.status === 'ABSENT').length;

    console.log('\nAttendance Summary:');
    console.log(`Total students: ${attendanceLogs.length}`);
    console.log(`Present: ${presentCount}`);
    console.log(`Absent: ${absentCount}`);

    console.log('\nStudents marked as PRESENT:');
    const presentStudents = attendanceLogs
      .filter(log => log.status === 'PRESENT')
      .map(log => ({
        enrollmentNo: log.student.enrollmentNo,
        name: log.student.name
      }))
      .sort((a, b) => a.enrollmentNo.localeCompare(b.enrollmentNo));

    presentStudents.forEach(student => {
      console.log(`${student.enrollmentNo} - ${student.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAttendance();