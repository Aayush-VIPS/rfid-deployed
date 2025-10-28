// Link device to the specific session that's causing issues
import prisma from '../src/services/prisma.js';

async function linkDeviceToSpecificSession() {
  try {
    console.log('=== LINKING DEVICE TO SPECIFIC SESSION ===');
    
    const sessionId = '68d3b94f3b0cd8aa8a3fdad4';
    const deviceMacAddress = '1C:69:20:A3:8A:4C';
    const teacherId = '68d165641600e44cc2dae943';
    
    // Check the session
    console.log('1. Checking session details...');
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        teacher: true,
        device: true,
        subjectInst: {
          include: {
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
    console.log(`   ID: ${session.id}`);
    console.log(`   Teacher: ${session.teacher.name} (${session.teacher.empId})`);
    console.log(`   Subject: ${session.subjectInst.subject.name}`);
    console.log(`   Current Device: ${session.device ? session.device.macAddr : 'NOT LINKED'}`);
    
    // Check the device
    console.log('\n2. Checking device...');
    const device = await prisma.device.findUnique({
      where: { macAddr: deviceMacAddress }
    });
    
    if (!device) {
      console.log(`❌ Device ${deviceMacAddress} not found`);
      return;
    }
    
    console.log(`✅ Device found: ${device.macAddr} (${device.name})`);
    
    // Link the device to the session
    if (!session.device) {
      console.log('\n3. Linking device to session...');
      const updatedSession = await prisma.classSession.update({
        where: { id: sessionId },
        data: { deviceId: device.id },
        include: {
          teacher: true,
          device: true
        }
      });
      
      console.log('✅ Device linked successfully!');
      
      // Test the API response
      const isAuth = updatedSession.device ? true : false;
      
      const apiResponse = {
        isAuth: isAuth,
        authenticatedBy: isAuth ? updatedSession.teacher.name : 'N/A',
        deviceMacAddress: isAuth ? updatedSession.device.macAddr : 'N/A',
        message: isAuth ? `Device authenticated and ready (${updatedSession.device.name || 'Unnamed Device'})` : 'Device not authenticated'
      };
      
      console.log('\n4. API Response for this session:');
      console.log(JSON.stringify(apiResponse, null, 2));
      
      console.log('\n🎉 SUCCESS! The AttendanceBoard should now show the device as authenticated.');
      
    } else {
      console.log('\n✅ Device already linked to this session');
    }
    
    // Also link to all other active sessions for this teacher
    console.log('\n5. Checking other active sessions for this teacher...');
    const otherActiveSessions = await prisma.classSession.findMany({
      where: {
        teacherId: teacherId,
        isClosed: false,
        id: { not: sessionId }
      },
      include: {
        device: true,
        subjectInst: {
          include: {
            subject: true
          }
        }
      }
    });
    
    console.log(`Found ${otherActiveSessions.length} other active sessions:`);
    
    for (const otherSession of otherActiveSessions) {
      console.log(`   - ${otherSession.id}: ${otherSession.subjectInst.subject.name}, Device: ${otherSession.device ? otherSession.device.macAddr : 'NOT LINKED'}`);
      
      if (!otherSession.device) {
        await prisma.classSession.update({
          where: { id: otherSession.id },
          data: { deviceId: device.id }
        });
        console.log(`     ✅ Linked device to session ${otherSession.id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkDeviceToSpecificSession();