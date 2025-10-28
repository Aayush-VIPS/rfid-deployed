import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAllRecentScans() {
  try {
    console.log('=== All Recent Attendance Logs (Last 10) ===');
    
    const recentLogs = await prisma.attendanceLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        student: { select: { name: true, enrollmentNo: true } }
      }
    });

    const now = new Date();
    console.log('Current time (script running):', now.toISOString());
    console.log('Current IST should be:', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    console.log('');

    recentLogs.forEach((log, index) => {
      const minutesAgo = Math.round((now - log.timestamp) / (1000 * 60));
      const hoursAgo = Math.round(minutesAgo / 60);
      
      console.log(`${index + 1}. ${log.student.name}`);
      console.log(`   Raw DB: ${log.timestamp.toISOString()}`);
      console.log(`   Display: ${log.timestamp.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
      })}`);
      
      if (minutesAgo < 60) {
        console.log(`   Time ago: ${minutesAgo} minutes ago`);
      } else {
        console.log(`   Time ago: ${hoursAgo} hours ago`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllRecentScans();