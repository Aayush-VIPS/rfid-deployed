// Debug why automatic linking didn't work
import prisma from '../src/services/prisma.js';

async function debugAutoLinking() {
  try {
    console.log('=== DEBUGGING AUTOMATIC DEVICE LINKING ===');
    
    const teacherId = '68d165641600e44cc2dae943';
    
    console.log('1. Checking for existing sessions with devices...');
    
    // This is the exact query from the session service
    const existingSessionWithDevice = await prisma.classSession.findFirst({
      where: {
        teacherId: teacherId,
        isClosed: false,
        deviceId: { not: null }
      },
      include: { device: true }
    });
    
    if (existingSessionWithDevice) {
      console.log('✅ Found session with device:');
      console.log(`   Session ID: ${existingSessionWithDevice.id}`);
      console.log(`   Device ID: ${existingSessionWithDevice.deviceId}`);
      console.log(`   Device MAC: ${existingSessionWithDevice.device.macAddr}`);
    } else {
      console.log('❌ No session with device found');
    }
    
    console.log('\n2. Checking all active sessions for this teacher...');
    const allActiveSessions = await prisma.classSession.findMany({
      where: {
        teacherId: teacherId,
        isClosed: false
      },
      include: {
        device: true,
        subjectInst: {
          include: {
            subject: true,
            section: true
          }
        }
      }
    });
    
    console.log(`Found ${allActiveSessions.length} active sessions:`);
    allActiveSessions.forEach(session => {
      console.log(`   - ${session.id}: ${session.subjectInst.subject.name}, deviceId: ${session.deviceId}, device: ${session.device ? session.device.macAddr : 'null'}`);
    });
    
    console.log('\n3. Manual device linking test...');
    const sessionToUpdate = allActiveSessions.find(s => !s.device);
    
    if (sessionToUpdate) {
      const deviceToLink = allActiveSessions.find(s => s.device);
      
      if (deviceToLink) {
        console.log(`Linking device ${deviceToLink.device.macAddr} to session ${sessionToUpdate.id}...`);
        
        await prisma.classSession.update({
          where: { id: sessionToUpdate.id },
          data: { deviceId: deviceToLink.deviceId }
        });
        
        console.log('✅ Manual linking complete!');
        
        // Verify the linking
        const updatedSession = await prisma.classSession.findUnique({
          where: { id: sessionToUpdate.id },
          include: { device: true }
        });
        
        console.log(`Verification: Session ${updatedSession.id} now has device ${updatedSession.device ? updatedSession.device.macAddr : 'null'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAutoLinking();