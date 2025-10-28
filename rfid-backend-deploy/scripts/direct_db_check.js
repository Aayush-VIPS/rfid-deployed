// Simple check of recent scan without Prisma imports
const { MongoClient } = require('mongodb');

async function checkRecentScan() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('rfid_attendance');
    const attendanceLogs = db.collection('AttendanceLog');
    
    const recentLog = await attendanceLogs.findOne(
      {},
      { sort: { timestamp: -1 } }
    );
    
    if (recentLog) {
      console.log('=== MOST RECENT SCAN ===');
      console.log('Timestamp in DB:', recentLog.timestamp);
      console.log('Type:', typeof recentLog.timestamp);
      
      if (recentLog.timestamp instanceof Date) {
        console.log('ISO String:', recentLog.timestamp.toISOString());
        console.log('IST Display:', recentLog.timestamp.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
      }
      
      console.log('\n=== CURRENT TIME FOR COMPARISON ===');
      const now = new Date();
      console.log('Current IST:', now.toString());
      console.log('Current UTC:', now.toISOString());
      
      if (recentLog.timestamp instanceof Date) {
        const storedUTC = recentLog.timestamp.toISOString();
        const expectedIST = recentLog.timestamp.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        console.log('\n=== ANALYSIS ===');
        console.log(`Stored UTC: ${storedUTC}`);
        console.log(`Should display as IST: ${expectedIST}`);
        console.log('If you see 05:32:58 pm, that means:');
        console.log('- Stored timestamp represents 12:02:58 UTC');
        console.log('- 12:02 UTC + 5:30 = 5:32 PM IST ❌');
        console.log('- But you scanned at ~12:03 IST, so it should store ~6:33 UTC ✅');
      }
    } else {
      console.log('No attendance logs found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkRecentScan();