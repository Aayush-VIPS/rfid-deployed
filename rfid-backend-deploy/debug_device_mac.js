// Debug script to check device MAC addresses in database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDeviceMacs() {
  try {
    console.log('=== DEVICE MAC ADDRESS DEBUG ===');
    
    // Get all devices
    const devices = await prisma.device.findMany({
      select: {
        id: true,
        macAddr: true,
        name: true,
        secret: true
      }
    });
    
    console.log('Registered devices in database:');
    devices.forEach((device, index) => {
      console.log(`${index + 1}. ID: ${device.id}`);
      console.log(`   MAC: ${device.macAddr}`);
      console.log(`   Name: ${device.name || 'No name'}`);
      console.log(`   Secret: ${device.secret ? device.secret.substring(0, 10) + '...' : 'No secret'}`);
      console.log('');
    });
    
    // Get all sessions with devices
    const sessionsWithDevices = await prisma.classSession.findMany({
      where: {
        deviceId: { not: null },
        isClosed: false
      },
      include: {
        device: true,
        teacher: true
      }
    });
    
    console.log('Active sessions with devices linked:');
    sessionsWithDevices.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session.id}`);
      console.log(`   Device MAC: ${session.device?.macAddr || 'No device'}`);
      console.log(`   Teacher: ${session.teacher?.name || 'No teacher'}`);
      console.log('');
    });
    
    // ESP32 hardcoded MAC from code
    const esp32HardcodedMac = "1C:69:20:A3:8A:4C";
    console.log(`ESP32 hardcoded MAC (from code): ${esp32HardcodedMac}`);
    
    const matchingDevice = devices.find(d => d.macAddr === esp32HardcodedMac);
    if (matchingDevice) {
      console.log('✅ ESP32 hardcoded MAC FOUND in database');
    } else {
      console.log('❌ ESP32 hardcoded MAC NOT FOUND in database');
      console.log('This is likely the root cause of the issue!');
    }
    
  } catch (error) {
    console.error('Error debugging device MACs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDeviceMacs();