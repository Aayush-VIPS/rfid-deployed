// Test creating session for available subject instance
import prisma from '../src/services/prisma.js';
import * as sessionService from '../src/services/sessionService.js';

async function testNewSessionLinking() {
  try {
    console.log('=== TESTING NEW SESSION AUTOMATIC DEVICE LINKING ===');
    
    const teacherId = '68d165641600e44cc2dae943';
    const availableSubjectInstId = '68d258a30c11d71d91639e6b'; // Sub - Section A
    
    console.log('1. Creating new session using service...');
    
    const newSession = await sessionService.startManualClassSession(teacherId, availableSubjectInstId);
    
    console.log('✅ New session created!');
    console.log(`   Session ID: ${newSession.id}`);
    console.log(`   Subject: ${newSession.subjectInst.subject.name} - Section ${newSession.subjectInst.section.name}`);
    console.log(`   Device: ${newSession.device ? `${newSession.device.macAddr} (${newSession.device.name})` : 'NOT LINKED'}`);
    
    if (newSession.device) {
      console.log('\n🎉 SUCCESS: Device automatically linked to new session!');
      console.log('\n2. Testing the API endpoint...');
      
      // Test the API endpoint manually
      const session = await prisma.classSession.findUnique({
        where: { id: newSession.id },
        include: {
          teacher: true,
          device: true
        }
      });
      
      const isAuth = session.device ? true : false;
      
      const apiResponse = {
        isAuth: isAuth,
        authenticatedBy: isAuth ? session.teacher.name : 'N/A',
        deviceMacAddress: isAuth ? session.device.macAddr : 'N/A',
        message: isAuth ? `Device authenticated and ready (${session.device.name || 'Unnamed Device'})` : 'Device not authenticated - Teacher needs to scan RFID card'
      };
      
      console.log('API Response would be:', JSON.stringify(apiResponse, null, 2));
      
    } else {
      console.log('\n❌ FAILED: Device was not automatically linked');
    }
    
    console.log(`\nNow you can test the AttendanceBoard with session ID: ${newSession.id}`);
    console.log(`The device should show as authenticated automatically.`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewSessionLinking();