// Restore device linking and fix the issue
import prisma from '../src/services/prisma.js';

async function restoreDeviceLinking() {
  try {
    console.log('=== RESTORING DEVICE LINKING ===');
    
    const teacherId = '68d165641600e44cc2dae943';
    const deviceMacAddress = '1C:69:20:A3:8A:4C';
    
    // Find the device
    const device = await prisma.device.findUnique({
      where: { macAddr: deviceMacAddress }
    });
    
    if (!device) {
      console.log(`❌ Device ${deviceMacAddress} not found`);
      return;
    }
    
    console.log(`✅ Device found: ${device.macAddr} (ID: ${device.id})`);
    
    // Find all active sessions for this teacher
    const activeSessions = await prisma.classSession.findMany({
      where: {
        teacherId: teacherId,
        isClosed: false
      },
      include: {
        subjectInst: {
          include: {
            subject: true,
            section: true
          }
        }
      }
    });
    
    console.log(`\nFound ${activeSessions.length} active sessions to link:`);
    
    for (const session of activeSessions) {
      console.log(`Linking device to session ${session.id} (${session.subjectInst.subject.name})...`);
      
      await prisma.classSession.update({
        where: { id: session.id },
        data: { deviceId: device.id }
      });
      
      console.log(`✅ Linked device to session ${session.id}`);
    }
    
    console.log('\n🎉 All sessions have been linked to the device!');
    
    // Test the API response for each session
    console.log('\n=== TESTING API RESPONSES ===');
    for (const session of activeSessions) {
      const updatedSession = await prisma.classSession.findUnique({
        where: { id: session.id },
        include: {
          teacher: true,
          device: true
        }
      });
      
      const isAuth = updatedSession.device ? true : false;
      
      const apiResponse = {
        isAuth: isAuth,
        authenticatedBy: isAuth ? updatedSession.teacher.name : 'N/A',
        deviceMacAddress: isAuth ? updatedSession.device.macAddr : 'N/A',
        message: isAuth ? `Device authenticated and ready (${updatedSession.device.name || 'Unnamed Device'})` : 'Device not authenticated'
      };
      
      console.log(`\nSession ${session.id} API response:`);
      console.log(JSON.stringify(apiResponse, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDeviceLinking();