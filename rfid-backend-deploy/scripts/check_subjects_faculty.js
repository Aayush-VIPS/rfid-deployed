import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSubjectsAndFaculty() {
  try {
    // Check available subjects
    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    });
    
    console.log('=== Available Subjects ===');
    console.log(`Found ${subjects.length} subjects:`);
    subjects.slice(0, 10).forEach((subject, idx) => {
      console.log(`  ${idx + 1}. ${subject.name} (${subject.code}) - ID: ${subject.id}`);
    });
    if (subjects.length > 10) {
      console.log(`  ... and ${subjects.length - 10} more subjects`);
    }

    // Check available faculty
    const faculty = await prisma.faculty.findMany({
      select: { id: true, name: true, empId: true },
      orderBy: { name: 'asc' }
    });
    
    console.log('\n=== Available Faculty ===');
    console.log(`Found ${faculty.length} faculty members:`);
    faculty.slice(0, 10).forEach((fac, idx) => {
      console.log(`  ${idx + 1}. ${fac.name} (${fac.empId}) - ID: ${fac.id}`);
    });
    if (faculty.length > 10) {
      console.log(`  ... and ${faculty.length - 10} more faculty`);
    }

    // Get MCA Section A info again
    const mcaSectionA = await prisma.section.findFirst({
      where: { 
        name: 'A',
        semester: {
          course: {
            name: 'MCA'
          }
        }
      },
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

    console.log('\n=== MCA Section A Details ===');
    if (mcaSectionA) {
      console.log(`Section ID: ${mcaSectionA.id}`);
      console.log(`Semester ID: ${mcaSectionA.semester.id}`);
      console.log(`Semester Number: ${mcaSectionA.semester.number}`);
      console.log(`Academic Year: ${mcaSectionA.semester.academicYear}`);
    }

    // Show first subject and faculty for creating sample subject instance
    if (subjects.length > 0 && faculty.length > 0) {
      console.log('\n=== Sample Data for Creating Subject Instance ===');
      console.log(`Section ID: ${mcaSectionA?.id}`);
      console.log(`Sample Subject: ${subjects[0].name} (ID: ${subjects[0].id})`);
      console.log(`Sample Faculty: ${faculty[0].name} (ID: ${faculty[0].id})`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubjectsAndFaculty();