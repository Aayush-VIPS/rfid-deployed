// Delete all DBMS sessions and logs first
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllDBMSSessions() {
  try {
    // Delete all attendance logs for DBMS sessions
    const deletedLogs = await prisma.attendanceLog.deleteMany({
      where: {
        session: {
          subjectInst: {
            subject: { code: 'MCA101' },
            sectionId: '68d168361600e44cc2dae94d'
          }
        }
      }
    });
    console.log(`Deleted ${deletedLogs.count} attendance logs`);

    // Delete all DBMS sessions
    const deletedSessions = await prisma.classSession.deleteMany({
      where: {
        subjectInst: {
          subject: { code: 'MCA101' },
          sectionId: '68d168361600e44cc2dae94d'
        }
      }
    });
    console.log(`Deleted ${deletedSessions.count} sessions`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllDBMSSessions();