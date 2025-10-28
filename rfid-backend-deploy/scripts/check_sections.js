import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getSections() {
  try {
    const sections = await prisma.section.findMany({
      include: {
        semester: {
          include: {
            course: {
              include: {
                department: true
              }
            }
          }
        }
      }
    });
    
    console.log('All sections:');
    sections.forEach(section => {
      console.log(`ID: ${section.id}, Name: ${section.name}, Course: ${section.semester.course.name}, Department: ${section.semester.course.department.name}`);
    });
    
    // Look for Section A specifically
    const sectionA = sections.find(s => s.name.toLowerCase() === 'a' || s.name.toLowerCase() === 'section a');
    if (sectionA) {
      console.log(`\nSection A found: ID = ${sectionA.id}`);
    } else {
      console.log('\nSection A not found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getSections();