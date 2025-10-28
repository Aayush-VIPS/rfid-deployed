import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createSubjectInstanceForMCA() {
  try {
    const SECTION_A_ID = '68d168361600e44cc2dae94d'; // MCA Section A
    const DSA_SUBJECT_ID = '68d168391600e44cc2dae961'; // DSA (MCA101)
    const FACULTY_ID = '68d165641600e44cc2dae943'; // Rajan Gupta

    console.log('Creating Subject Instance for MCA Section A...');
    
    // Check if subject instance already exists
    const existingInstance = await prisma.subjectInstance.findFirst({
      where: {
        subjectId: DSA_SUBJECT_ID,
        sectionId: SECTION_A_ID,
        facultyId: FACULTY_ID
      }
    });

    if (existingInstance) {
      console.log('Subject Instance already exists:', existingInstance.id);
      return existingInstance;
    }

    // Create new subject instance
    const subjectInstance = await prisma.subjectInstance.create({
      data: {
        subjectId: DSA_SUBJECT_ID,
        sectionId: SECTION_A_ID,
        facultyId: FACULTY_ID
      },
      include: {
        subject: true,
        section: {
          include: {
            semester: {
              include: {
                course: true
              }
            }
          }
        },
        faculty: true
      }
    });

    console.log('✅ Subject Instance Created Successfully!');
    console.log(`ID: ${subjectInstance.id}`);
    console.log(`Subject: ${subjectInstance.subject.name} (${subjectInstance.subject.code})`);
    console.log(`Section: ${subjectInstance.section.name} (${subjectInstance.section.semester.course.name})`);
    console.log(`Faculty: ${subjectInstance.faculty.name}`);

    // Also create a second subject instance with C Programming for more options
    const CProgrammingSubjectId = '68d145a90b39d7a868705035';
    
    const existingCProgramming = await prisma.subjectInstance.findFirst({
      where: {
        subjectId: CProgrammingSubjectId,
        sectionId: SECTION_A_ID,
        facultyId: FACULTY_ID
      }
    });

    if (!existingCProgramming) {
      const cProgrammingInstance = await prisma.subjectInstance.create({
        data: {
          subjectId: CProgrammingSubjectId,
          sectionId: SECTION_A_ID,
          facultyId: FACULTY_ID
        },
        include: {
          subject: true,
          faculty: true
        }
      });

      console.log('✅ Additional Subject Instance Created!');
      console.log(`ID: ${cProgrammingInstance.id}`);
      console.log(`Subject: ${cProgrammingInstance.subject.name} (${cProgrammingInstance.subject.code})`);
      console.log(`Faculty: ${cProgrammingInstance.faculty.name}`);
    }

    console.log('\n🎯 Now you can:');
    console.log('1. Go to teacher dashboard and start a session for DSA or C Programming');
    console.log('2. The students will be visible in the attendance board');
    console.log('3. MCA Section A now has subject instances assigned');

    return subjectInstance;

  } catch (error) {
    console.error('Error creating subject instance:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSubjectInstanceForMCA();