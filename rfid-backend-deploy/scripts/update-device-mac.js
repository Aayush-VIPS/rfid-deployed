/**
 * Script to update the demo device MAC address to match your actual ESP32
 * Run: node scripts/update-device-mac.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateDeviceMac() {
  try {
    const OLD_MAC = "AA:BB:CC:DD:EE:FF"; // Placeholder MAC from demo
    const NEW_MAC = "1C:69:20:A3:8A:4C"; // Your actual ESP32 MAC
    
    // Find the demo device
    const device = await prisma.device.findUnique({
      where: { macAddr: OLD_MAC }
    });
    
    if (!device) {
      console.log("❌ Demo device with placeholder MAC not found.");
      console.log("   Looking for existing device with ESP32 MAC...");
      
      const existingDevice = await prisma.device.findUnique({
        where: { macAddr: NEW_MAC }
      });
      
      if (existingDevice) {
        console.log("✅ Device with ESP32 MAC already exists:");
        console.log("   ID:", existingDevice.id);
        console.log("   MAC:", existingDevice.macAddr);
        console.log("   Secret:", existingDevice.secret);
      } else {
        console.log("❌ No device found with either MAC address.");
        console.log("   Please run add-demo-device.js first.");
      }
      return;
    }
    
    // Update the MAC address
    const updatedDevice = await prisma.device.update({
      where: { macAddr: OLD_MAC },
      data: { macAddr: NEW_MAC }
    });
    
    console.log("✅ Device MAC address updated successfully!");
    console.log("📋 Updated Device Details:");
    console.log("   ID:", updatedDevice.id);
    console.log("   MAC Address:", updatedDevice.macAddr);
    console.log("   Secret:", updatedDevice.secret);
    console.log("   Name:", updatedDevice.name);
    
    console.log("\n🚀 Your ESP32 is now ready to authenticate!");
    
  } catch (error) {
    console.error("❌ Error updating device MAC:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDeviceMac();