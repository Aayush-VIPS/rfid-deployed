// Test by creating session for different subject instance
import prisma from '../src/services/prisma.js';

async function testWithDifferentSubject() {
  try {
    console.log('=== TESTING WITH DIFFERENT SUBJECT ===');
    
    const teacherId = '68d165641600e44cc2dae943';
    
    // Find all subject instances for this teacher
    const subjectInstances = await prisma.subjectInstance.findMany({
      where: { facultyId: teacherId },
      include: {
        subject: true,
        section: true
      }
    });
    
    console.log(`Teacher has ${subjectInstances.length} subject instances:`);
    subjectInstances.forEach((si, index) => {
      console.log(`   ${index + 1}. ${si.subject.name} - Section ${si.section.name} (ID: ${si.id})`);
    });
    
    // Check which ones have active sessions
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
    
    console.log(`\nActive sessions:`);
    const activeSubjectInstIds = new Set();
    activeSessions.forEach(session => {
      console.log(`   - ${session.subjectInst.subject.name} - Section ${session.subjectInst.section.name} (Device: ${session.device ? session.device.macAddr : 'NOT LINKED'})`);
      activeSubjectInstIds.add(session.subjectInstId);
    });
    
    // Find a subject instance without active session
    const availableSubjectInst = subjectInstances.find(si => !activeSubjectInstIds.has(si.id));
    
    if (!availableSubjectInst) {
      console.log('\n❌ No available subject instances without active sessions');
      console.log('Let me create a test session by closing the existing one temporarily...');
      
      // Close existing session temporarily
      const sessionToClose = activeSessions[0];
      await prisma.classSession.update({
        where: { id: sessionToClose.id },
        data: { isClosed: true }
      });
      console.log(`✅ Temporarily closed session ${sessionToClose.id}`);
      
      // Now test creating a new session
      const newSessionData = {
        subjectInstId: sessionToClose.subjectInstId,
        teacherId: teacherId,
        startAt: new Date(),
        isClosed: false
      };
      
      // Check if there's an authenticated device for this teacher
      const existingSessionWithDevice = await prisma.classSession.findFirst({
        where: {
          teacherId: teacherId,
          isClosed: false,
          deviceId: { not: null }
        },
        include: { device: true }
      });
      
      if (existingSessionWithDevice) {
        newSessionData.deviceId = existingSessionWithDevice.deviceId;
        console.log(`✅ Found authenticated device: ${existingSessionWithDevice.device.macAddr}`);
      }
      
      const newSession = await prisma.classSession.create({
        data: newSessionData,
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
      
      console.log(`\n🎉 NEW SESSION CREATED:`);
      console.log(`   ID: ${newSession.id}`);
      console.log(`   Subject: ${newSession.subjectInst.subject.name}`);
      console.log(`   Device: ${newSession.device ? `${newSession.device.macAddr} (${newSession.device.name})` : 'NOT LINKED'}`);
      
      if (newSession.device) {
        console.log('\n✅ SUCCESS: Device automatically linked!');
      } else {
        console.log('\n❌ FAILED: Device was not linked');
      }
      
    } else {
      console.log(`\n✅ Found available subject instance: ${availableSubjectInst.subject.name} - Section ${availableSubjectInst.section.name}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWithDifferentSubject();