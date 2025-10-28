// Clean up test sessions
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanTestSessions() {
  try {
    // Get Subject Instance ID for DBMS (MCA 101) and section
    const subjectInst = await prisma.subjectInst.findFirst({
      where: {
        subject: { code: 'MCA101' },
        sectionId: '68d168361600e44cc2dae94d'
      }
    });

    if (!subjectInst) {
      console.log('Subject instance not found');
      return;
    }

    console.log('Found subject instance:', subjectInst);

    // Get all sessions for this subject instance
    const sessions = await prisma.classSession.findMany({
      where: {
        subjectInstId: subjectInst.id,
        isClosed: true
      },
      orderBy: {
        startAt: 'desc'
      },
      include: {
        logs: true
      }
    });

    console.log(`Found ${sessions.length} sessions for subject instance ${subjectInstId}`);

    // Keep only the most recent session (the real one)
    if (sessions.length === 0) {
      console.log('No sessions found to clean up.');
      return;
    }

    const [realSession, ...testSessions] = sessions;

    console.log('Keeping real session:', {
      id: realSession.id,
      startAt: realSession.startAt,
      attendanceCount: realSession.logs.length
    });

    // Delete all test sessions and their attendance logs
    console.log(`Deleting ${testSessions.length} test sessions...`);
    
    for (const session of testSessions) {
      // First delete attendance logs
      // Delete attendance logs
      await prisma.attendanceLogs.deleteMany({
        where: {
          sessionId: session.id
        }
      });

      // Then delete the session
      await prisma.classSession.delete({
        where: {
          id: session.id
        }
      });

      console.log(`Deleted session ${session.id} with ${session.logs.length} attendance logs`);
    }

    console.log('Clean up complete!');

  } catch (error) {
    console.error('Error cleaning up test sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestSessions();