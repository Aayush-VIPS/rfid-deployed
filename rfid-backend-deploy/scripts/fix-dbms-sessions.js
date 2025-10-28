// Clean up test sessions for DBMS (MCA 101)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupSessions() {
  try {
    // Get the LATEST session for MCA101 (the real one)
    const keepSession = await prisma.classSession.findFirst({
      where: {
        subjectInst: {
          subject: { code: 'MCA101' },
          sectionId: '68d168361600e44cc2dae94d'
        }
      },
      orderBy: {
        startAt: 'desc' // Changed to desc to keep the most recent one
      }
    });

    if (!keepSession) {
      console.log('No sessions found');
      return;
    }

    console.log('Keeping the latest session:', keepSession);

    // Delete all other sessions and their attendance logs
    const deletedLogs = await prisma.attendanceLog.deleteMany({
      where: {
        session: {
          subjectInst: {
            subject: { code: 'MCA101' },
            sectionId: '68d168361600e44cc2dae94d'
          },
          id: {
            not: keepSession.id
          }
        }
      }
    });

    console.log(`Deleted ${deletedLogs.count} attendance logs`);

    const deletedSessions = await prisma.classSession.deleteMany({
      where: {
        subjectInst: {
          subject: { code: 'MCA101' },
          sectionId: '68d168361600e44cc2dae94d'
        },
        id: {
          not: keepSession.id
        }
      }
    });

    console.log(`Deleted ${deletedSessions.count} test sessions`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSessions();