import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSpecificStudentLog() {
  try {
    // Find Aayush Gambhir's recent log
    const aayushLog = await prisma.attendanceLog.findFirst({
      where: {
        student: {
          name: 'Aayush Gambhir'
        }
      },
      orderBy: { timestamp: 'desc' },
      include: {
        student: { select: { name: true, enrollmentNo: true } }
      }
    });

    if (!aayushLog) {
      console.log('No attendance log found for Aayush Gambhir');
      return;
    }

    console.log('=== Aayush Gambhir Recent Log ===');
    console.log('Student:', aayushLog.student.name);
    console.log('Enrollment:', aayushLog.student.enrollmentNo);
    console.log('Raw timestamp from DB:', aayushLog.timestamp.toISOString());
    console.log('Raw timestamp toString():', aayushLog.timestamp.toString());
    
    // Test different formatting approaches
    const timestamp = aayushLog.timestamp;
    
    console.log('\n=== Different Display Methods ===');
    
    // Method 1: Direct formatting (what we're using now)
    const directFormat = timestamp.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    console.log('Method 1 (with timeZone):', directFormat);
    
    // Method 2: Without timeZone (what was broken)
    const withoutTZ = timestamp.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    console.log('Method 2 (without timeZone):', withoutTZ);
    
    // Method 3: Check what time it actually is in IST right now
    const nowUTC = new Date();
    const nowIST = nowUTC.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    console.log('\n=== Current Time Check ===');
    console.log('Current UTC:', nowUTC.toISOString());
    console.log('Current IST should be:', nowIST);
    
    // Calculate time difference
    const logTime = new Date(aayushLog.timestamp);
    const diffMinutes = Math.floor((nowUTC - logTime) / (1000 * 60));
    console.log('Minutes since log:', diffMinutes);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificStudentLog();