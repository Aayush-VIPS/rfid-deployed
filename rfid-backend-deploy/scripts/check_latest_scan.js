// Check the latest attendance record for recent scans
import prisma from '../src/services/prisma.js';

async function checkLatestScan() {
  try {
    const latestLog = await prisma.attendanceLog.findFirst({
      orderBy: { timestamp: 'desc' },
      include: {
        student: {
          select: { name: true }
        }
      }
    });

    if (latestLog) {
      console.log('=== LATEST SCAN ===');
      console.log('Student:', latestLog.student.name);
      console.log('Raw timestamp in DB:', latestLog.timestamp.toISOString());
      console.log('Local time display:', latestLog.timestamp.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      
      console.log('\n=== CURRENT TIME COMPARISON ===');
      const now = new Date();
      console.log('Current system time:', now.toString());
      console.log('Current UTC time:', now.toISOString());
      
      console.log('\n=== PROBLEM ANALYSIS ===');
      const dbTime = new Date(latestLog.timestamp);
      const currentTime = new Date();
      console.log('DB timestamp represents:', dbTime.toUTCString());
      console.log('If this were IST stored as UTC, it would be:', new Date(dbTime.getTime() - 5.5 * 60 * 60 * 1000).toISOString());
    } else {
      console.log('No attendance logs found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestScan();