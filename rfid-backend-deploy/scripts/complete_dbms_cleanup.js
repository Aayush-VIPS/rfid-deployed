// Complete cleanup of DBMS (MCA101) class attendance
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeDBMSCleanup() {
  try {
    // First get the DBMS subject instance ID
    const subjectInst = await prisma.subjectInstance.findFirst({
      where: {
        subject: { code: 'MCA101' },
        sectionId: '68d168361600e44cc2dae94d'
      }
    });

    if (!subjectInst) {
      console.log('No DBMS subject instance found');
      return;
    }

    console.log('Found DBMS subject instance:', subjectInst.id);

    // Delete all attendance logs for this subject's sessions
    const deletedLogs = await prisma.attendanceLog.deleteMany({
      where: {
        session: {
          subjectInstId: subjectInst.id
        }
      }
    });

    console.log(`Deleted ${deletedLogs.count} attendance logs`);

    // Delete all sessions for this subject
    const deletedSessions = await prisma.classSession.deleteMany({
      where: {
        subjectInstId: subjectInst.id
      }
    });

    console.log(`Deleted ${deletedSessions.count} sessions`);

    console.log('DBMS attendance completely cleaned up!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeDBMSCleanup();