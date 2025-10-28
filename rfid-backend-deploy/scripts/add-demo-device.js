/**
 * Script to add a demo RFID device to the database
 * Run: node scripts/add-demo-device.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addDemoDevice() {
  try {
    // Demo device credentials - you can change these
    const DEMO_MAC = "AA:BB:CC:DD:EE:FF"; // Placeholder MAC - will be replaced by actual ESP32 MAC
    const DEMO_SECRET = "demo-device-secret-123"; // Simple secret for demo
    
    // Check if device already exists
    const existingDevice = await prisma.device.findUnique({
      where: { macAddr: DEMO_MAC }
    });
    
    if (existingDevice) {
      console.log("Demo device already exists:");
      console.log("MAC:", existingDevice.macAddr);
      console.log("Secret:", existingDevice.secret);
      return;
    }
    
    // Get first faculty member to associate with device (optional)
    const firstFaculty = await prisma.faculty.findFirst();
    
    const device = await prisma.device.create({
      data: {
        macAddr: DEMO_MAC,
        secret: DEMO_SECRET,
        name: "Demo RFID Device",
        location: "Classroom 101",
        facultyId: firstFaculty?.id // Associate with first faculty if exists
      }
    });
    
    console.log("✅ Demo device created successfully!");
    console.log("📋 Device Details:");
    console.log("   ID:", device.id);
    console.log("   MAC Address:", device.macAddr);
    console.log("   Secret:", device.secret);
    console.log("   Name:", device.name);
    console.log("   Location:", device.location);
    
    console.log("\n🔧 Next Steps:");
    console.log("1. Update your Arduino code with this secret:");
    console.log(`   #define DEVICE_SECRET "${device.secret}"`);
    console.log("2. After uploading code to ESP32, check the actual MAC address");
    console.log("3. Update the device MAC in database to match ESP32's actual MAC");
    
  } catch (error) {
    console.error("❌ Error creating demo device:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoDevice();