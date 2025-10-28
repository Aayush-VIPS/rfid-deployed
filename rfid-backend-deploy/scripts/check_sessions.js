// Check existing DBMS sessions
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSessions() {
  try {
    const sessions = await prisma.classSession.findMany({
      where: {
        subjectInst: {
          subject: { code: 'MCA101' },
          sectionId: '68d168361600e44cc2dae94d'
        }
      },
      include: {
        subjectInst: {
          include: {
            subject: true
          }
        }
      }
    });

    console.log(`Found ${sessions.length} DBMS sessions:`);
    for (const session of sessions) {
      console.log(`\nSession ID: ${session.id}`);
      console.log(`Start: ${session.startAt}`);
      console.log(`End: ${session.endAt}`);
      
      // Count attendance for this session
      const attendanceCount = await prisma.attendanceLog.count({
        where: {
          sessionId: session.id
        }
      });
      console.log(`Attendance logs: ${attendanceCount}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions();