// Restore the latest DBMS session with its attendance
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreSession() {
  try {
    // First create the session
    const session = await prisma.classSession.create({
      data: {
        subjectInst: {
          connect: {
            id: '68d25965fb317fe6c161bb89'
          }
        },
        teacher: {
          connect: {
            id: '68d165641600e44cc2dae943'
          }
        },
        startAt: new Date('2025-09-24T03:15:00Z'),
        endAt: new Date('2025-09-24T04:45:00Z'),
        isClosed: true
      }
    });

    console.log('Created session:', session);

    // Get all students in the section
    const students = await prisma.student.findMany({
      where: {
        sectionId: '68d168361600e44cc2dae94d'
      }
    });

    console.log(`Found ${students.length} students`);

    // Create attendance logs for present students
    const presentStudentEnrollments = ['A1', 'A2', 'A3', 'A4', 'A5'];
    
    for (const student of students) {
      await prisma.attendanceLog.create({
        data: {
          student: {
            connect: {
              id: student.id
            }
          },
          session: {
            connect: {
              id: session.id
            }
          },
          status: presentStudentEnrollments.includes(student.enrollmentNo) ? 'PRESENT' : 'ABSENT',
          timestamp: presentStudentEnrollments.includes(student.enrollmentNo) ? 
            new Date('2025-09-24T03:20:00Z') : null
        }
      });
    }

    console.log('Restored attendance logs');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreSession();