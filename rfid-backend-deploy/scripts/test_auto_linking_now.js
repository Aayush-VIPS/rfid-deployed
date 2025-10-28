// Test that auto-linking now works for new sessions
import prisma from '../src/services/prisma.js';
import * as sessionService from '../src/services/sessionService.js';

async function testAutoLinkingNow() {
  try {
    console.log('=== TESTING AUTO-LINKING FOR NEW SESSIONS ===');
    
    const teacherId = '68d165641600e44cc2dae943';
    
    // Find an available subject instance that doesn't have an active session
    console.log('1. Finding available subject instance...');
    
    const subjectInstances = await prisma.subjectInstance.findMany({
      where: { facultyId: teacherId },
      include: {
        subject: true,
        section: true
      }
    });
    
    const activeSessions = await prisma.classSession.findMany({
      where: {
        teacherId: teacherId,
        isClosed: false
      }
    });
    
    const activeSubjectInstIds = new Set(activeSessions.map(s => s.subjectInstId));
    
    const availableSubjectInst = subjectInstances.find(si => !activeSubjectInstIds.has(si.id));
    
    if (!availableSubjectInst) {
      console.log('❌ No available subject instances. Using different approach...');
      
      // Close one session temporarily for testing
      const sessionToClose = activeSessions[0];
      await prisma.classSession.update({
        where: { id: sessionToClose.id },
        data: { isClosed: true }
      });
      
      console.log(`✅ Temporarily closed session ${sessionToClose.id} for testing`);
      
      // Now try to create a new session for the same subject instance
      const newSession = await sessionService.startManualClassSession(teacherId, sessionToClose.subjectInstId);
      
      console.log('✅ New session created:');
      console.log(`   ID: ${newSession.id}`);
      console.log(`   Subject: ${newSession.subjectInst.subject.name}`);
      console.log(`   Device: ${newSession.device ? `${newSession.device.macAddr} (${newSession.device.name})` : 'NOT LINKED'}`);
      
      if (newSession.device) {
        console.log('\n🎉 SUCCESS: Auto-linking is working! Device automatically linked to new session.');
        
        // Test API response
        const apiResponse = {
          isAuth: true,
          authenticatedBy: newSession.teacher.name,
          deviceMacAddress: newSession.device.macAddr,
          message: `Device authenticated and ready (${newSession.device.name})`
        };
        
        console.log('\nAPI Response would be:');
        console.log(JSON.stringify(apiResponse, null, 2));
        
      } else {
        console.log('\n❌ FAILED: Auto-linking still not working');
      }
      
      console.log(`\nNew session ID for testing: ${newSession.id}`);
      
    } else {
      console.log(`✅ Found available: ${availableSubjectInst.subject.name} - Section ${availableSubjectInst.section.name}`);
      
      const newSession = await sessionService.startManualClassSession(teacherId, availableSubjectInst.id);
      
      console.log('\n2. New session created:');
      console.log(`   ID: ${newSession.id}`);
      console.log(`   Subject: ${newSession.subjectInst.subject.name}`);
      console.log(`   Device: ${newSession.device ? `${newSession.device.macAddr} (${newSession.device.name})` : 'NOT LINKED'}`);
      
      if (newSession.device) {
        console.log('\n🎉 SUCCESS: Auto-linking is working!');
      } else {
        console.log('\n❌ FAILED: Auto-linking still not working');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAutoLinkingNow();