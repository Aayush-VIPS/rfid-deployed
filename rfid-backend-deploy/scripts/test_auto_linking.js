// Test automatic device linking on new session creation
import prisma from '../src/services/prisma.js';
import * as sessionService from '../src/services/sessionService.js';

async function testAutoLinking() {
  try {
    console.log('=== TESTING AUTOMATIC DEVICE LINKING ===');
    
    const teacherId = '68d165641600e44cc2dae943'; // Teacher who has authenticated device
    
    // First, check current active sessions for this teacher
    console.log('\n1. Checking current active sessions...');
    const currentSessions = await prisma.classSession.findMany({
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
    
    console.log(`Found ${currentSessions.length} active sessions:`);
    currentSessions.forEach(session => {
      console.log(`   - ${session.id}: ${session.subjectInst.subject.name}, Device: ${session.device ? session.device.macAddr : 'NOT LINKED'}`);
    });
    
    // Find a subject instance for this teacher
    console.log('\n2. Finding subject instance for manual session...');
    const subjectInstances = await prisma.subjectInstance.findMany({
      where: { facultyId: teacherId },
      include: {
        subject: true,
        section: true
      }
    });
    
    if (subjectInstances.length === 0) {
      console.log('❌ No subject instances found for this teacher');
      return;
    }
    
    const subjectInstance = subjectInstances[0];
    console.log(`✅ Using subject instance: ${subjectInstance.subject.name} - Section ${subjectInstance.section.name}`);
    
    // Create a new manual session using the service
    console.log('\n3. Creating new manual session...');
    try {
      const newSession = await sessionService.startManualClassSession(teacherId, subjectInstance.id);
      
      console.log('✅ New session created successfully!');
      console.log(`   Session ID: ${newSession.id}`);
      console.log(`   Device linked: ${newSession.device ? newSession.device.macAddr : 'NOT LINKED'}`);
      
      if (newSession.device) {
        console.log('🎉 SUCCESS: Device automatically linked to new session!');
      } else {
        console.log('❌ FAILED: Device was not automatically linked');
      }
      
      // Clean up - close the test session
      await prisma.classSession.update({
        where: { id: newSession.id },
        data: { isClosed: true }
      });
      console.log('🗑️  Test session cleaned up (marked as closed)');
      
    } catch (error) {
      if (error.status === 409) {
        console.log('⚠️  Session already exists for this subject instance');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAutoLinking();