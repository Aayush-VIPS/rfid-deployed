// Debug why session service auto-linking isn't working
import prisma from '../src/services/prisma.js';

async function debugSessionService() {
  try {
    console.log('=== DEBUGGING SESSION SERVICE AUTO-LINKING ===');
    
    const teacherId = '68d165641600e44cc2dae943';
    
    // This is the exact query from our modified session service
    console.log('1. Testing the session service query...');
    console.log(`   Looking for active sessions with devices for teacher: ${teacherId}`);
    
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
      console.log('   → This deviceId should be used for new sessions');
    } else {
      console.log('❌ No session with device found');
      console.log('   → This is why auto-linking failed');
    }
    
    console.log('\n2. Checking all current active sessions...');
    const allActiveSessions = await prisma.classSession.findMany({
      where: {
        teacherId: teacherId,
        isClosed: false
      },
      include: {
        device: true,
        subjectInst: {
          include: {
            subject: true
          }
        }
      },
      orderBy: {
        startAt: 'desc'
      }
    });
    
    console.log(`Found ${allActiveSessions.length} active sessions:`);
    allActiveSessions.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.id}: ${session.subjectInst.subject.name}`);
      console.log(`      Created: ${session.startAt.toISOString()}`);
      console.log(`      Device ID: ${session.deviceId || 'null'}`);
      console.log(`      Device MAC: ${session.device ? session.device.macAddr : 'null'}`);
    });
    
    // Simulate what should happen when creating a new session
    console.log('\n3. Simulating session creation logic...');
    
    if (existingSessionWithDevice) {
      console.log(`   ✅ Auto-linking would use device ID: ${existingSessionWithDevice.deviceId}`);
      console.log(`   ✅ Device MAC: ${existingSessionWithDevice.device.macAddr}`);
    } else if (allActiveSessions.length > 0 && allActiveSessions[0].device) {
      console.log(`   ✅ Could use device from latest session: ${allActiveSessions[0].device.macAddr}`);
    } else {
      console.log('   ❌ No device available for auto-linking');
      console.log('   📝 This explains why new sessions are created without devices');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSessionService();