// Update attendance for the EXISTING DBMS session
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAttendance() {
  try {
    // Get the EXISTING session
    const session = await prisma.classSession.findFirst({
      where: {
        subjectInst: {
          subject: { code: 'MCA101' },
          sectionId: '68d168361600e44cc2dae94d'
        }
      }
    });

    if (!session) {
      console.log('No existing session found!');
      return;
    }

    console.log('Found existing session:', session.id);

    // First delete all existing attendance logs for this session
    const deletedLogs = await prisma.attendanceLog.deleteMany({
      where: {
        sessionId: session.id
      }
    });

    console.log(`Deleted ${deletedLogs.count} old attendance logs`);

    // List of enrollment numbers that should be present
    const presentEnrollments = [
      '00117704425', // Roshan
      '00417704425', // UJJWAL SINGH
      '01017704425', // Arjun Sharma
      '01317704425', // Silky
      '01417704425', // Harsimar Kaur
      '01517704425', // Kuljot Singh
      '03017704425', // Sai Abhinav
      '04017704425', // Shubham Nainwal
      '04317704425', // Deepanshu saxena
      '04917704425', // Shekhar Chhabra
      '05017704425', // Prabhneet Singh Sethi
      '06317704425', // Aarushi
      '06717704425', // Ansh Mongia
      '07217704425', // Hardik Sharma
      '07317704425', // RAJNIKANT UPADHYAY
      '07517704425', // Aryan sharma
      '07717704425', // Yash Bhartari
      '08417704425', // Shivam jain
      '08517704425', // Harsh Mathur
      '08817704425', // Kartik
      '08917704425', // Roopina Girotra
      '09117704425', // Deepesh Chauhan
      '09217704425', // Jamir uddin khan
      '09717704425', // Harshit Gupta
      '10217704425', // Pranav Verma
      '10517704425', // Diya Arora
      '13417704425', // RAKESH KUMAR BEHERA
      '13517704425', // Khushi Aggarwal
      '13817704425', // Ritika Thakur
      '14317704425', // Garima Sharma
      '14417704425', // Shivam
      '16017704425', // Ekansh verma
      '16117704425', // Drishti jain
      '16317704425', // Chiraag sharma
      '16417704425', // Ashad Hussain
      '16517704425', // Kshitiz Goel
      '16617704425', // Tarini Grover
      '16717704425', // Ayan Lal
      '16917704425', // Gaganpreet Kaur
      '17817704425', // Priyanka Gulati
      '17917704425', // Neha Tyagi
      '18317704425', // Kashish Rathore
      '18517704425', // AshmitTanwar
      '18917704425', // Anjali Gupta
      '19017704425', // Krishnangshu Banerji
      '19217704425', // Nishant Singh
      '12517704425', // BHARAT SHIVMAM POPLI
      '12717704425'  // Gaurav Ahlawat
    ];

    // Get the device for logs
    const device = await prisma.device.findFirst();
    if (!device) {
      throw new Error('No device found');
    }

    // Get present students
    const students = await prisma.student.findMany({
      where: {
        enrollmentNo: {
          in: presentEnrollments
        }
      }
    });

    // Create attendance logs ONLY for present students in the EXISTING session
    for (const student of students) {
      await prisma.attendanceLog.create({
        data: {
          status: 'PRESENT',
          timestamp: session.startAt,
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
          device: {
            connect: {
              id: device.id
            }
          }
        }
      });
    }

    console.log(`Created ${students.length} PRESENT attendance logs in the existing session`);
    console.log('Done!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAttendance();