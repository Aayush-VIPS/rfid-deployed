import { PrismaClient } from '@prisma/client';
import { toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();

async function checkAttendanceTimestamps() {
  try {
    // Get recent attendance logs
    const recentLogs = await prisma.attendanceLog.findMany({
      include: {
        student: { select: { name: true, enrollmentNo: true } },
        session: {
          include: {
            subjectInst: {
              include: {
                subject: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    console.log('=== Recent Attendance Logs ===');
    if (recentLogs.length === 0) {
      console.log('No attendance logs found. Scan some students first!');
      return;
    }

    recentLogs.forEach((log, idx) => {
      console.log(`${idx + 1}. ${log.student.name} (${log.student.enrollmentNo})`);
      console.log(`   Subject: ${log.session.subjectInst.subject.name}`);
      console.log(`   Raw timestamp: ${log.timestamp.toISOString()}`);
      console.log(`   Formatted IST: ${log.timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log('');
    });

    // Test creating a new timestamp with current IST logic
    console.log('=== Current Timestamp Creation Logic ===');
    const nowUtc = new Date();
    const nowIst = toZonedTime(nowUtc, 'Asia/Kolkata');
    
    console.log('Current UTC:', nowUtc.toISOString());
    console.log('toZonedTime result:', nowIst.toISOString());
    console.log('Display as IST:', nowIst.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    console.log('Display UTC as IST:', nowUtc.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendanceTimestamps();