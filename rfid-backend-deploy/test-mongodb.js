import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    
    // Test the connection with a simple ping
    await prisma.$runCommandRaw({ ping: 1 });
    console.log('✅ MongoDB connection successful!');
    
    // Test creating and reading data
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();