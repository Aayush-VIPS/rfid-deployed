// Check the new session and fix linking
import prisma from '../src/services/prisma.js';

async function checkNewSession() {
  try {
    const sessionId = '68d3b73f3b0cd8aa8a3fdad2'; // New session ID
    const deviceMacAddress = '1C:69:20:A3:8A:4C';
    
    console.log('=== CHECKING NEW SESSION ===');
    console.log(`Session ID: ${sessionId}`);
    
    // Check the session
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        teacher: true,
        device: true,
        subjectInst: {
          include: {
            faculty: true,
            subject: true,
            section: true
          }
        }
      }
    });
    
    if (!session) {
      console.log('❌ Session not found');
      return;
    }
    
    console.log('✅ Session found:');
    console.log(`   Teacher: ${session.subjectInst.faculty.name} (${session.subjectInst.faculty.empId})`);
    console.log(`   Subject: ${session.subjectInst.subject.name}`);
    console.log(`   Section: ${session.subjectInst.section.name}`);
    console.log(`   Device: ${session.device ? session.device.macAddr : 'NOT LINKED'}`);
    console.log(`   Closed: ${session.isClosed}`);
    
    // Check if device exists
    const device = await prisma.device.findUnique({
      where: { macAddr: deviceMacAddress }
    });
    
    if (!device) {
      console.log(`❌ Device ${deviceMacAddress} not found`);
      return;
    }
    
    console.log(`✅ Device found: ${device.macAddr} (${device.name})`);
    
    // Check if the teacher matches the one who authenticated the device
    const authenticatedTeacherId = '68d165641600e44cc2dae943'; // From ESP32 logs
    
    if (session.teacherId === authenticatedTeacherId) {
      console.log('✅ Teacher matches the authenticated teacher');
      
      // Link the device to this session if not already linked
      if (!session.device) {
        console.log('🔧 Linking device to session...');
        await prisma.classSession.update({
          where: { id: sessionId },
          data: { deviceId: device.id }
        });
        console.log('✅ Device linked successfully!');
      } else {
        console.log('✅ Device already linked');
      }
    } else {
      console.log(`❌ Teacher mismatch:`);
      console.log(`   Session teacher ID: ${session.teacherId}`);
      console.log(`   Authenticated teacher ID: ${authenticatedTeacherId}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewSession();