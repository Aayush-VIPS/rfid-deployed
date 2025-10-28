import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createPCoordUser() {
  try {
    console.log('Creating Program Coordinator user...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'pcoord@vipstc.edu.in' }
    });
    
    if (existingUser) {
      console.log('✅ PCOORD user already exists');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create the user with faculty profile
    const user = await prisma.user.create({
      data: {
        email: 'pcoord@vipstc.edu.in',
        passwordHash: hashedPassword,
        role: 'PCOORD',
        facultyProfile: {
          create: {
            empId: 'PCOORD001',
            name: 'Demo Coordinator',
            phone: '9999999999',
            rfidUid: '1234567890'
          }
        }
      },
      include: {
        facultyProfile: true
      }
    });
    
    console.log('✅ PCOORD user created successfully:');
    console.log({
      id: user.id,
      email: user.email,
      role: user.role,
      faculty: user.facultyProfile
    });
    
  } catch (error) {
    console.error('❌ Error creating PCOORD user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPCoordUser();