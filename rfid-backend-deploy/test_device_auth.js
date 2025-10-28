// Script to test device authentication with different MAC addresses
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDeviceAuth() {
  try {
    console.log('=== TESTING DEVICE AUTHENTICATION ===\n');
    
    // Test with hardcoded MAC (what's in database)
    const hardcodedMac = "1C:69:20:A3:8A:4C";
    console.log(`Testing with hardcoded MAC: ${hardcodedMac}`);
    
    const device = await prisma.device.findUnique({
      where: { macAddr: hardcodedMac }
    });
    
    if (device) {
      console.log('✅ Device found in database:');
      console.log(`   ID: ${device.id}`);
      console.log(`   Name: ${device.name}`);
      console.log(`   MAC: ${device.macAddr}`);
    } else {
      console.log('❌ Device NOT found in database');
    }
    
    // Check for any faculty with RFID
    console.log('\n=== CHECKING FACULTY WITH RFID ===');
    const facultyWithRfid = await prisma.faculty.findMany({
      where: {
        rfidUid: { not: "" }
      },
      select: {
        id: true,
        name: true,
        empId: true,
        rfidUid: true
      }
    });
    
    console.log(`Found ${facultyWithRfid.length} faculty with RFID:`);
    facultyWithRfid.forEach((faculty, index) => {
      console.log(`${index + 1}. ${faculty.name} (${faculty.empId})`);
      console.log(`   ID: ${faculty.id}`);
      console.log(`   RFID: ${faculty.rfidUid}`);
      console.log('');
    });
    
    // Check for active sessions
    console.log('=== CHECKING ACTIVE SESSIONS ===');
    const activeSessions = await prisma.classSession.findMany({
      where: {
        isClosed: false
      },
      include: {
        teacher: { select: { name: true, empId: true } },
        device: { select: { macAddr: true, name: true } },
        subjectInst: {
          include: {
            subject: { select: { name: true, code: true } },
            section: { select: { name: true } }
          }
        }
      }
    });
    
    console.log(`Found ${activeSessions.length} active sessions:`);
    activeSessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session.id}`);
      console.log(`   Teacher: ${session.teacher?.name} (${session.teacher?.empId})`);
      console.log(`   Subject: ${session.subjectInst?.subject?.name} (${session.subjectInst?.subject?.code})`);
      console.log(`   Section: ${session.subjectInst?.section?.name}`);
      console.log(`   Device: ${session.device ? session.device.macAddr : 'NO DEVICE LINKED'}`);
      console.log(`   Started: ${session.startAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error testing device auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeviceAuth();