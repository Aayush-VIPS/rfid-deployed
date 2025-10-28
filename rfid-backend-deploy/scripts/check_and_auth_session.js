// Check session and simulate device authentication
import prisma from '../src/services/prisma.js';

async function checkAndAuth() {
  try {
    const sessionId = '68d3a7353b0cd8aa8a3fdad1';
    
    console.log('=== CHECKING SESSION ===');
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        subjectInst: {
          include: {
            faculty: true,
            subject: true,
            section: true
          }
        },
        device: true
      }
    });
    
    if (!session) {
      console.log('❌ Session not found');
      return;
    }
    
    console.log(`✅ Session found:`);
    console.log(`   Teacher: ${session.subjectInst.faculty.name} (${session.subjectInst.faculty.empId})`);
    console.log(`   Subject: ${session.subjectInst.subject.name}`);
    console.log(`   Device: ${session.device ? session.device.macAddr : 'NOT LINKED'}`);
    console.log(`   RFID UID: ${session.subjectInst.faculty.rfidUid || 'NOT SET'}`);
    
    console.log('\n=== CHECKING DEVICES ===');
    const devices = await prisma.device.findMany();
    console.log(`Found ${devices.length} registered devices:`);
    devices.forEach(device => {
      console.log(`   ${device.macAddr} - ${device.name || 'No name'}`);
    });
    
    // If no device linked and teacher has RFID, simulate authentication
    if (!session.device && session.subjectInst.faculty.rfidUid) {
      console.log('\n=== SIMULATING AUTHENTICATION ===');
      
      if (devices.length === 0) {
        // Register a test device first
        console.log('Registering test device...');
        const testDevice = await prisma.device.create({
          data: {
            macAddr: 'AA:BB:CC:DD:EE:FF',
            name: 'Test Device for Simulation'
          }
        });
        console.log(`✅ Test device created: ${testDevice.macAddr}`);
        
        // Link device to session
        await prisma.classSession.update({
          where: { id: sessionId },
          data: { deviceId: testDevice.id }
        });
        
        console.log('✅ Device linked to session');
      } else {
        // Use existing device
        const device = devices[0];
        await prisma.classSession.update({
          where: { id: sessionId },
          data: { deviceId: device.id }
        });
        
        console.log(`✅ Device ${device.macAddr} linked to session`);
      }
      
      console.log('\n🎉 Authentication simulation complete!');
      console.log('The AttendanceBoard should now show device as authenticated.');
      
    } else if (!session.subjectInst.faculty.rfidUid) {
      console.log('\n❌ Teacher has no RFID UID set. Cannot authenticate.');
      console.log('To fix this, update the teacher record with an RFID UID.');
    } else {
      console.log('\n✅ Device already authenticated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndAuth();