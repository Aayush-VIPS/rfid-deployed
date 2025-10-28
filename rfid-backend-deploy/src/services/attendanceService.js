// rfid-attendance-system/apps/backend/src/services/attendanceService.js
import createError from 'http-errors';
import prisma from './prisma.js';

/**
 * Processes an RFID scan for attendance logging.
 * @param {string} rfidUid - The RFID UID scanned.
 * @param {string} deviceMacAddress - The MAC address of the device that scanned.
 * @param {string} sessionId - The ID of the active class session.
 * @returns {Promise<Object>} The created AttendanceLog object.
 */
async function processRfidScan(rfidUid, deviceMacAddress, sessionId) {
  if (!rfidUid || !deviceMacAddress || !sessionId) {
    throw createError(400, 'RFID UID, device MAC address, and session ID are required.');
  }

  const stringSessionId = String(sessionId);

  // 1. Verify the device exists
  const device = await prisma.device.findUnique({
    where: { macAddr: deviceMacAddress },
  });

  if (!device) {
    throw createError(404, 'Device not found in database.');
  }

  // 2. Verify the session is active
  const session = await prisma.classSession.findUnique({
    where: { id: stringSessionId },
    include: {
      subjectInst: {
        include: {
          faculty: true,
          subject: true,
          section: true
        }
      }
    }
  });

  if (!session || session.isClosed) {
    throw createError(400, 'Session is not active or does not exist.');
  }

  // 3. Identify the student
  const student = await prisma.student.findFirst({
    where: { rfidUid: rfidUid },
  });

  if (!student) {
    throw createError(404, 'Student with this RFID UID not found.');
  }

  // 4. Check for duplicate attendance
  const existingAttendance = await prisma.attendanceLog.findFirst({
    where: {
      sessionId: stringSessionId,
      studentId: student.id,
      status: 'PRESENT',
    },
  });

  if (existingAttendance) {
    throw createError(409, 'Student already marked present for this session.');
  }

  // 5. Log attendance - Store current IST time converted to UTC
  const currentUTC = new Date(); // This already gives us UTC when using toISOString()
  console.log('🕐 Current system time (IST):', currentUTC.toString());
  console.log('🕐 Storing attendance timestamp (UTC):', currentUTC.toISOString(), 'UTC');
  
  const newAttendance = await prisma.attendanceLog.create({
    data: {
      sessionId: stringSessionId,
      studentId: student.id,
      timestamp: currentUTC, // This stores correctly as UTC
      status: 'PRESENT',
      deviceMacAddress: deviceMacAddress,
      deviceId: device.id
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          enrollmentNo: true,
          rfidUid: true,
        },
      },
    },
  });

  // 6. Update session's deviceId if not already set (first scan from this device)
  if (!session.deviceId) {
    await prisma.classSession.update({
      where: { id: stringSessionId },
      data: { deviceId: device.id }
    });
  }

  return newAttendance;
}

/**
 * Retrieves attendance snapshot with present/absent students for frontend.
 * @param {string} sessionId - The ID of the session.
 * @returns {Promise<Object>} Structured attendance data for frontend.
 */
async function getAttendanceSnapshot(sessionId) {
  try {
    console.log('Getting attendance snapshot for session:', sessionId);
    
    // Get session with section info
    const session = await prisma.classSession.findUnique({
      where: { id: String(sessionId) },
      include: {
        subjectInst: {
          include: {
            section: {
              include: {
                students: {
                  select: { id: true, name: true, enrollmentNo: true },
                  orderBy: { name: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!session) {
      console.error('Session not found:', sessionId);
      throw createError(404, 'Session not found');
    }

    console.log('Session found, section has', session.subjectInst.section.students.length, 'students');

    // Get attendance logs for this session
    const attendanceLogs = await prisma.attendanceLog.findMany({
      where: { sessionId: String(sessionId) },
      include: {
        student: { 
          select: { id: true, name: true, enrollmentNo: true } 
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    console.log('Found', attendanceLogs.length, 'attendance logs');

    // All students in the section
    const allStudentsInSection = session.subjectInst.section.students || [];
    const presentStudentIds = new Set(attendanceLogs.map(log => log.student.id));

    // Present students (those who scanned)
    const presentStudents = attendanceLogs.map(log => ({
      id: log.student.id,
      name: log.student.name,
      enrollmentNo: log.student.enrollmentNo,
      status: 'PRESENT',
      timestamp: log.timestamp
    }));

    // Absent students (those who didn't scan)
    const absentStudents = allStudentsInSection
      .filter(student => !presentStudentIds.has(student.id))
      .map(student => ({
        id: student.id,
        name: student.name,
        enrollmentNo: student.enrollmentNo,
        status: 'ABSENT',
        timestamp: null
      }));

    const result = {
      presentStudents,
      absentStudents,
      totalStudentsInSessionSection: allStudentsInSection.length,
      presentCount: presentStudents.length,
      absentCount: absentStudents.length
    };

    console.log('Returning attendance snapshot:', {
      presentCount: result.presentCount,
      absentCount: result.absentCount,
      totalStudents: result.totalStudentsInSessionSection
    });

    return result;
  } catch (error) {
    console.error('Error in getAttendanceSnapshot:', error);
    throw error;
  }
}

/**
 * Get detailed attendance data for reporting.
 */
async function getDetailedAttendanceReport(filters) {
  const { subjectId, sectionId, startDate, endDate } = filters;

  const whereClause = {
    subjectInst: {
      subjectId: subjectId ? String(subjectId) : undefined,
      sectionId: sectionId ? String(sectionId) : undefined,
    },
    startAt: {
      gte: startDate ? new Date(startDate) : undefined,
      lte: endDate ? new Date(endDate) : undefined,
    },
  };

  const sessions = await prisma.classSession.findMany({
    where: whereClause,
    include: {
      subjectInst: {
        include: {
          subject: true,
          section: true,
          faculty: true,
        },
      },
      logs: {
        include: {
          student: {
            select: { id: true, name: true, enrollmentNo: true },
          },
        },
      },
    },
    orderBy: { startAt: 'desc' },
  });

  return sessions;
}

/**
 * Get teacher's attendance report for specific class and date.
 */
async function getTeacherAttendanceByClassAndDate(facultyId, filters) {
  const { subjectId, sectionId, date } = filters;
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const sessions = await prisma.classSession.findMany({
    where: {
      subjectInst: {
        subjectId: String(subjectId),
        sectionId: String(sectionId),
      },
      startAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      logs: {
        include: {
          student: {
            select: { id: true, name: true, enrollmentNo: true, rfidUid: true },
          },
        },
      },
      subjectInst: {
        include: {
          subject: true,
          section: true,
        },
      },
    },
    orderBy: { startAt: 'asc' },
  });

  return sessions;
}

/**
 * Get comprehensive attendance logs for a session (used for exports).
 */
async function getAttendanceReportForSession(sessionId) {
  const session = await prisma.classSession.findUnique({
    where: { id: String(sessionId) },
    include: {
      subjectInst: {
        include: {
          subject: true,
          section: true,
          faculty: true,
        },
      },
      logs: {
        include: {
          student: {
            select: { id: true, name: true, enrollmentNo: true, rfidUid: true },
          },
        },
        orderBy: { timestamp: 'asc' },
      },
    },
  });

  if (!session) {
    throw createError(404, 'Session not found.');
  }

  return session;
}

/**
 * Generate summarized attendance report for section over date range.
 */
async function getAggregatedAttendanceReport(filters) {
  const { sectionId, startDate, endDate, subjectId } = filters;

  const start = startDate ? new Date(startDate) : undefined;
  if (start) start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : undefined;
  if (end) end.setHours(23, 59, 59, 999);

  // Get all students in the specified section
  const studentsInSection = await prisma.student.findMany({
    where: { sectionId: String(sectionId) },
    select: { id: true, name: true, enrollmentNo: true },
    orderBy: { name: 'asc' },
  });

  if (studentsInSection.length === 0) {
    return [];
  }

  // Get all relevant sessions
  const sessionWhereClause = {
    subjectInst: {
      sectionId: String(sectionId),
      subjectId: subjectId ? String(subjectId) : undefined,
    },
    startAt: {
      gte: start,
      lte: end,
    },
    isClosed: true,
  };

  const relevantSessions = await prisma.classSession.findMany({
    where: sessionWhereClause,
    select: { id: true, subjectInstId: true },
  });

  const sessionIds = relevantSessions.map(s => s.id);
  const totalClasses = relevantSessions.length;

  if (totalClasses === 0) {
    return studentsInSection.map(student => ({
      studentId: student.id,
      name: student.name,
      enrollmentNo: student.enrollmentNo,
      presentCount: 0,
      absentCount: 0,
      totalClassesOccurred: 0,
      percentage: 0,
    }));
  }

  // Get attendance logs
  const attendanceLogs = await prisma.attendanceLog.findMany({
    where: {
      sessionId: { in: sessionIds },
      status: 'PRESENT',
    },
    select: { sessionId: true, studentId: true },
  });

  // Aggregate attendance
  const studentAttendanceMap = new Map();
  studentsInSection.forEach(student => {
    studentAttendanceMap.set(student.id, {
      studentId: student.id,
      name: student.name,
      enrollmentNo: student.enrollmentNo,
      presentCount: 0,
      absentCount: 0,
      totalClassesOccurred: totalClasses,
      percentage: 0,
    });
  });

  attendanceLogs.forEach(log => {
    const studentData = studentAttendanceMap.get(log.studentId);
    if (studentData) {
      studentData.presentCount++;
    }
  });

  // Calculate final values
  const aggregatedReport = Array.from(studentAttendanceMap.values()).map(studentData => {
    studentData.absentCount = studentData.totalClassesOccurred - studentData.presentCount;
    studentData.percentage =
      studentData.totalClassesOccurred > 0
        ? parseFloat(((studentData.presentCount / studentData.totalClassesOccurred) * 100).toFixed(2))
        : 0;
    return studentData;
  });

  return aggregatedReport;
}

export {
  processRfidScan,
  getAttendanceSnapshot,
  getDetailedAttendanceReport,
  getTeacherAttendanceByClassAndDate,
  getAttendanceReportForSession,
  getAggregatedAttendanceReport,
};
