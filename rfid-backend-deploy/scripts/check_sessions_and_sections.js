import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSessionsAndSections() {
  try {
    // First check all MCA Section A students
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
        students: {
          select: { id: true, name: true, enrollmentNo: true }
        },
        semester: {
          include: {
            course: {
              include: {
                department: true
              }
            }
          }
        },
        instances: {
          include: {
            subject: true,
            faculty: true
          }
        }
      }
    });

    console.log('=== MCA Section A Info ===');
    if (mcaSectionA) {
      console.log(`Section ID: ${mcaSectionA.id}`);
      console.log(`Section Name: ${mcaSectionA.name}`);
      console.log(`Course: ${mcaSectionA.semester.course.name}`);
      console.log(`Department: ${mcaSectionA.semester.course.department.name}`);
      console.log(`Total Students: ${mcaSectionA.students.length}`);
      console.log(`First 5 students:`);
      mcaSectionA.students.slice(0, 5).forEach((student, idx) => {
        console.log(`  ${idx + 1}. ${student.name} (${student.enrollmentNo})`);
      });
      console.log(`Subject Instances: ${mcaSectionA.instances.length}`);
      mcaSectionA.instances.forEach((instance, idx) => {
        console.log(`  ${idx + 1}. ${instance.subject.name} by ${instance.faculty.name}`);
      });
    } else {
      console.log('MCA Section A not found!');
    }

    // Check all active sessions
    console.log('\n=== Active Sessions ===');
    const activeSessions = await prisma.classSession.findMany({
      where: { isClosed: false },
      include: {
        subjectInst: {
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
        }
      },
      orderBy: { startAt: 'desc' }
    });

    console.log(`Found ${activeSessions.length} active sessions:`);
    activeSessions.forEach((session, idx) => {
      console.log(`  ${idx + 1}. Session ID: ${session.id}`);
      console.log(`     Subject: ${session.subjectInst.subject.name}`);
      console.log(`     Section: ${session.subjectInst.section.name} (${session.subjectInst.section.semester.course.name})`);
      console.log(`     Faculty: ${session.subjectInst.faculty.name}`);
      console.log(`     Started: ${session.startAt.toISOString()}`);
      console.log(`     Section ID: ${session.subjectInst.section.id}`);
      console.log('');
    });

    // Check if there are any sessions for MCA Section A specifically
    if (mcaSectionA) {
      const mcaSessionsForSectionA = await prisma.classSession.findMany({
        where: {
          subjectInst: {
            sectionId: mcaSectionA.id
          }
        },
        include: {
          subjectInst: {
            include: {
              subject: true,
              faculty: true
            }
          }
        },
        orderBy: { startAt: 'desc' },
        take: 10
      });

      console.log(`\n=== Sessions for MCA Section A ===`);
      console.log(`Found ${mcaSessionsForSectionA.length} sessions for MCA Section A:`);
      mcaSessionsForSectionA.forEach((session, idx) => {
        console.log(`  ${idx + 1}. Session ID: ${session.id}`);
        console.log(`     Subject: ${session.subjectInst.subject.name}`);
        console.log(`     Faculty: ${session.subjectInst.faculty.name}`);
        console.log(`     Started: ${session.startAt.toISOString()}`);
        console.log(`     Closed: ${session.isClosed}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessionsAndSections();