// Debug the automatic linking issue
import prisma from '../src/services/prisma.js';

async function debugLinking() {
  try {
    const deviceMacAddress = '1C:69:20:A3:8A:4C';
    const teacherId = '68d165641600e44cc2dae943';
    const sessionId = '68d3a7353b0cd8aa8a3fdad1';
    
    console.log('=== DEBUGGING AUTOMATIC DEVICE LINKING ===');
    
    // 1. Check if device exists
    console.log('\n1. Checking device...');
    const device = await prisma.device.findUnique({
      where: { macAddr: deviceMacAddress }
    });
    
    if (!device) {
      console.log(`❌ Device with MAC ${deviceMacAddress} not found in database`);
      console.log('Available devices:');
      const allDevices = await prisma.device.findMany();
      allDevices.forEach(d => console.log(`   - ${d.macAddr} (ID: ${d.id})`));
      return;
    } else {
      console.log(`✅ Device found: ${device.macAddr} (ID: ${device.id}, Name: ${device.name})`);
    }
    
    // 2. Check if teacher exists
    console.log('\n2. Checking teacher...');
    const teacher = await prisma.faculty.findUnique({
      where: { id: teacherId }
    });
    
    if (!teacher) {
      console.log(`❌ Teacher with ID ${teacherId} not found`);
      return;
    } else {
      console.log(`✅ Teacher found: ${teacher.name} (${teacher.empId}, RFID: ${teacher.rfidUid})`);
    }
    
    // 3. Check active sessions for this teacher
    console.log('\n3. Checking active sessions...');
    const activeSessions = await prisma.classSession.findMany({
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
    
    console.log(`Found ${activeSessions.length} active sessions for teacher ${teacher.empId}:`);
    activeSessions.forEach(session => {
      console.log(`   - Session ${session.id}:`);
      console.log(`     Subject: ${session.subjectInst.subject.name}`);
      console.log(`     Section: ${session.subjectInst.section.name}`);
      console.log(`     Device: ${session.device ? session.device.macAddr : 'NOT LINKED'}`);
      console.log(`     Closed: ${session.isClosed}`);
    });
    
    // 4. If sessions exist but not linked, link them now
    if (activeSessions.length > 0) {
      console.log('\n4. Linking device to sessions...');
      for (const session of activeSessions) {
        if (!session.device) {
          await prisma.classSession.update({
            where: { id: session.id },
            data: { deviceId: device.id }
          });
          console.log(`✅ Linked device to session ${session.id}`);
        } else {
          console.log(`⚠️  Session ${session.id} already linked to device ${session.device.macAddr}`);
        }
      }
      console.log('\n🎉 Linking complete!');
    } else {
      console.log('\n❌ No active sessions found to link');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLinking();