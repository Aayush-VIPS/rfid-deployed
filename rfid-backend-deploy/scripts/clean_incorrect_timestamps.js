// Delete the incorrect attendance records and test fresh
import prisma from '../src/services/prisma.js';

async function cleanAndTest() {
  try {
    console.log('=== CLEANING INCORRECT RECORDS ===');
    
    // Delete the problematic records for Aayush Gambhir
    const deleted = await prisma.attendanceLog.deleteMany({
      where: {
        student: {
          name: 'Aayush Gambhir'
        },
        timestamp: {
          gte: new Date('2025-09-24T11:00:00.000Z'),
          lte: new Date('2025-09-24T12:00:00.000Z')
        }
      }
    });
    
    console.log('Deleted records:', deleted.count);
    
    console.log('\n=== TESTING FRESH TIMESTAMP ===');
    const testTime = new Date();
    console.log('What a new scan would store:', testTime.toISOString());
    console.log('What frontend would display:', testTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndTest();