// Test attendance timestamp with real data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTimestampDisplay() {
  try {
    // Create a test attendance log with our IST logic
    const now = new Date();
    const istTimestamp = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    
    console.log('=== Backend IST Logic Test ===');
    console.log('Current UTC:', now.toISOString());
    console.log('IST Timestamp (backend creates):', istTimestamp.toISOString());
    console.log('IST Display should be:', istTimestamp.toLocaleTimeString('en-IN'));
    
    // Test frontend formatting functions
    console.log('\n=== Frontend Formatting Test ===');
    
    // Current frontend logic (simplified without timeZone)
    const formatTimeInIST_New = (dateString) => {
      const date = new Date(dateString);
      const options = {
        hour: '2-digit',
        minute: '2-digit', 
        second: '2-digit',
        hour12: true
      };
      return date.toLocaleTimeString('en-IN', options);
    };
    
    // Old frontend logic (with timeZone)
    const formatTimeInIST_Old = (dateString) => {
      const date = new Date(dateString);
      const options = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit', 
        hour12: true
      };
      return date.toLocaleTimeString('en-IN', options);
    };
    
    console.log('IST timestamp with NEW formatting:', formatTimeInIST_New(istTimestamp));
    console.log('IST timestamp with OLD formatting:', formatTimeInIST_Old(istTimestamp));
    console.log('UTC timestamp with OLD formatting:', formatTimeInIST_Old(now));
    
    // Get actual recent attendance
    const recentLog = await prisma.attendanceLog.findFirst({
      orderBy: { timestamp: 'desc' },
      include: { student: { select: { name: true } } }
    });
    
    if (recentLog) {
      console.log('\n=== Real Database Timestamp Test ===');
      console.log(`Student: ${recentLog.student.name}`);
      console.log('Raw DB timestamp:', recentLog.timestamp.toISOString());
      console.log('NEW format:', formatTimeInIST_New(recentLog.timestamp));
      console.log('OLD format:', formatTimeInIST_Old(recentLog.timestamp));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTimestampDisplay();