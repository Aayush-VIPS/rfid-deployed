import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const SECTION_A_ID = '68d168361600e44cc2dae94d'; // MCA Section A

async function removeIncorrectStudents() {
  try {
    console.log('Removing incorrectly imported students...');
    
    // Find students in MCA Section A with names starting with 'MCA' (institute codes)
    const incorrectStudents = await prisma.student.findMany({
      where: {
        sectionId: SECTION_A_ID,
        name: {
          startsWith: 'MCA'
        }
      }
    });
    
    console.log(`Found ${incorrectStudents.length} students to remove`);
    
    // Delete attendance logs first (foreign key constraint)
    for (const student of incorrectStudents) {
      await prisma.attendanceLog.deleteMany({
        where: {
          studentId: student.id
        }
      });
    }
    
    // Delete the students
    const deleteResult = await prisma.student.deleteMany({
      where: {
        sectionId: SECTION_A_ID,
        name: {
          startsWith: 'MCA'
        }
      }
    });
    
    console.log(`Successfully removed ${deleteResult.count} incorrect students`);
    
  } catch (error) {
    console.error('Error removing students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeIncorrectStudents();