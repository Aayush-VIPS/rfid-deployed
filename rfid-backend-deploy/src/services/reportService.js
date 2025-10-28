// rfid-attendance-system/apps/backend/src/services/reportService.js
import createError from 'http-errors';
import prisma from './prisma.js'; // Ensure prisma is imported here
import ExcelJS from 'exceljs';

/**
 * Fetch per-student attendance report for a section over a date range,
 * optionally filtered by subject and course.
 *
 * @param {object} filters       - Filters: { sectionId?: string, subjectId?: string, courseId?: string, from: Date, to: Date }
 * @returns {Promise<Array<{
 * studentId: string,
 * name: string,
 * enrollmentNo: string,
 * presentCount: number,
 * absentCount: number,
 * totalClassesOccurred: number, // Total sessions for this subject/section in range
 * percentage: number
 * }>>}
 */
export async function getReport(filters) { // ✅ FIXED: Removed prisma parameter since it's imported
  const { sectionId, subjectId, courseId, from, to } = filters;

  // 1) Parse & validate inputs
  // ✅ FIXED: Keep IDs as strings instead of converting to numbers
  const sectionIdStr = sectionId ? String(sectionId) : undefined;
  const subjectIdStr = subjectId ? String(subjectId) : undefined;
  const courseIdStr = courseId ? String(courseId) : undefined;
  const fromDate = new Date(from);
  const toDate = new Date(to);

  // Validate date range
  if (
    isNaN(fromDate.getTime()) ||
    isNaN(toDate.getTime()) ||
    fromDate > toDate
  ) {
    throw createError(400, 'Invalid date range provided.');
  }

  // ✅ IMPROVED: Remove number validation since we're keeping as strings
  // IDs are already validated in the route layer with ObjectId.isValid()

  // Normalize to full days
  fromDate.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone issues with date ranges
  toDate.setUTCHours(23, 59, 59, 999); // Use UTC to avoid timezone issues with date ranges

  // 2) Load all students. Filter by sectionId only if it's provided.
  const students = await prisma.student.findMany({
    where: {
      ...(sectionIdStr !== undefined && { sectionId: sectionIdStr }) // ✅ FIXED: Use string sectionId
    },
    select: {
      id: true,
      name: true,
      enrollmentNo: true
    }
  });

  // If no students match the criteria (e.g., sectionId is provided but no students in it)
  if (students.length === 0) {
    return [];
  }

  // 3) Count total closed sessions in the range for that section/subject/course
  // This represents "Total Classes Occurred"
  let sessionWhereClause = {
    isClosed: true,
    startAt: { gte: fromDate, lte: toDate },
    subjectInst: {
      ...(sectionIdStr !== undefined && { sectionId: sectionIdStr }), // ✅ FIXED: Use string sectionId
      ...(subjectIdStr !== undefined && { subjectId: subjectIdStr }), // ✅ FIXED: Use string subjectId
    }
  };

  if (courseIdStr) { // ✅ FIXED: Use string courseId
    sessionWhereClause.subjectInst.section = {
        semester: {
            courseId: courseIdStr // ✅ FIXED: Use string courseId
        }
    };
  }

  const totalClassesOccurred = await prisma.classSession.count({
    where: sessionWhereClause
  });

  // 4) Tally presents per student via groupBy
  let attendanceLogWhereClause = {
    status: 'PRESENT',
    timestamp: { gte: fromDate, lte: toDate },
    session: {
      subjectInst: {
        ...(sectionIdStr !== undefined && { sectionId: sectionIdStr }), // ✅ FIXED: Use string sectionId
        ...(subjectIdStr !== undefined && { subjectId: subjectIdStr }), // ✅ FIXED: Use string subjectId
      }
    }
  };

  if (courseIdStr) { // ✅ FIXED: Use string courseId
    attendanceLogWhereClause.session.subjectInst.section = {
        semester: {
            course: { id: courseIdStr } // ✅ FIXED: Use string courseId
        }
    };
  }

  const presentGroups = await prisma.attendanceLog.groupBy({
    by: ['studentId'],
    where: attendanceLogWhereClause,
    _count: { studentId: true }
  });

  // Map studentId → presentCount
  const presentMap = Object.fromEntries(
    presentGroups.map((g) => [g.studentId, g._count.studentId])
  );

  // 5) Build report rows
  const report = students.map((s) => {
    const presentCount = presentMap[s.id] || 0;
    const absentCount  = totalClassesOccurred - presentCount;
    const percentage =
      totalClassesOccurred > 0 ? (presentCount / totalClassesOccurred) * 100 : 0;

    return {
      studentId:    s.id, // This is already a string ObjectId
      name:         s.name,
      enrollmentNo: s.enrollmentNo,
      presentCount,
      absentCount,
      totalClassesOccurred, // NEW: Total classes occurred
      percentage:   Math.round(percentage * 100) / 100  // two decimals
    };
  });

  // 6) Sort by student name
  report.sort((a, b) => a.name.localeCompare(b.name));

  return report;
}

/**
 * Get attendance report for an individual student across multiple subjects/courses
 * 
 * @param {string} studentId - The ID of the student
 * @param {object} filters - Optional filters: { from?: Date, to?: Date, subjectId?: string, courseId?: string }
 * @returns {Promise<{
 *   student: object,
 *   summary: object,
 *   subjectBreakdown: Array
 * }>}
 */
export async function getStudentReport(studentId, filters = {}) {
  const { from, to, subjectId, courseId } = filters;
  
  // Validate student exists
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      section: {
        include: {
          semester: {
            include: {
              course: true
            }
          }
        }
      }
    }
  });

  if (!student) {
    throw createError(404, 'Student not found');
  }

  // Set default date range if not provided (current semester)
  let fromDate = from ? new Date(from) : new Date();
  let toDate = to ? new Date(to) : new Date();
  
  if (!from && !to) {
    // Default to current month
    fromDate.setDate(1);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
    toDate.setHours(23, 59, 59, 999);
  } else {
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate.setUTCHours(23, 59, 59, 999);
  }

  // Build where clause for attendance logs
  let attendanceWhereClause = {
    studentId: studentId,
    timestamp: { gte: fromDate, lte: toDate },
    session: {
      subjectInst: {
        sectionId: student.sectionId,
        ...(subjectId && { subjectId: subjectId })
      }
    }
  };

  if (courseId) {
    attendanceWhereClause.session.subjectInst.section = {
      semester: { courseId: courseId }
    };
  }

  // Get attendance logs with subject details
  const attendanceLogs = await prisma.attendanceLog.findMany({
    where: attendanceWhereClause,
    include: {
      session: {
        include: {
          subjectInst: {
            include: {
              subject: true
            }
          }
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  // Get total sessions for calculation
  let sessionWhereClause = {
    isClosed: true,
    startAt: { gte: fromDate, lte: toDate },
    subjectInst: {
      sectionId: student.sectionId,
      ...(subjectId && { subjectId: subjectId })
    }
  };

  if (courseId) {
    sessionWhereClause.subjectInst.section = {
      semester: { courseId: courseId }
    };
  }

  const totalSessions = await prisma.classSession.count({
    where: sessionWhereClause
  });

  // Calculate summary stats
  const presentCount = attendanceLogs.filter(log => log.status === 'PRESENT').length;
  const absentCount = totalSessions - presentCount;
  const percentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

  // Group by subject for breakdown
  const subjectMap = {};
  attendanceLogs.forEach(log => {
    const subjectId = log.session.subjectInst.subjectId;
    const subjectName = log.session.subjectInst.subject.name;
    
    if (!subjectMap[subjectId]) {
      subjectMap[subjectId] = {
        subjectId,
        subjectName,
        presentCount: 0,
        totalSessions: 0,
        logs: []
      };
    }
    
    if (log.status === 'PRESENT') {
      subjectMap[subjectId].presentCount++;
    }
    subjectMap[subjectId].logs.push(log);
  });

  // Get total sessions per subject
  const subjectBreakdown = await Promise.all(
    Object.values(subjectMap).map(async (subject) => {
      const subjectSessionCount = await prisma.classSession.count({
        where: {
          isClosed: true,
          startAt: { gte: fromDate, lte: toDate },
          subjectInst: {
            sectionId: student.sectionId,
            subjectId: subject.subjectId
          }
        }
      });

      const subjectAbsent = subjectSessionCount - subject.presentCount;
      const subjectPercentage = subjectSessionCount > 0 ? (subject.presentCount / subjectSessionCount) * 100 : 0;

      return {
        ...subject,
        totalSessions: subjectSessionCount,
        absentCount: subjectAbsent,
        percentage: Math.round(subjectPercentage * 100) / 100
      };
    })
  );

  return {
    student: {
      id: student.id,
      name: student.name,
      enrollmentNo: student.enrollmentNo,
      admissionYear: student.admissionYear,
      batchYear: student.batchYear,
      section: student.section.name,
      course: student.section.semester.course.name
    },
    summary: {
      presentCount,
      absentCount,
      totalSessions,
      percentage: Math.round(percentage * 100) / 100,
      dateRange: { from: fromDate, to: toDate }
    },
    subjectBreakdown: subjectBreakdown.sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
    recentLogs: attendanceLogs.slice(0, 20) // Latest 20 entries
  };
}

/**
 * Get attendance report for students in a specific batch
 * 
 * @param {object} filters - { batchYear?: string, admissionYear?: number, sectionId?: string, from: Date, to: Date }
 * @returns {Promise<Array>} Array of student attendance summaries
 */
export async function getBatchReport(filters) {
  const { batchYear, admissionYear, sectionId, from, to, subjectId, courseId } = filters;
  
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  // Validate date range
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
    throw createError(400, 'Invalid date range provided.');
  }
  
  fromDate.setUTCHours(0, 0, 0, 0);
  toDate.setUTCHours(23, 59, 59, 999);

  // Build student filter
  let studentWhere = {};
  if (batchYear) studentWhere.batchYear = batchYear;
  if (admissionYear) studentWhere.admissionYear = admissionYear;
  if (sectionId) studentWhere.sectionId = sectionId;

  // Get students matching criteria
  const students = await prisma.student.findMany({
    where: studentWhere,
    include: {
      section: {
        include: {
          semester: {
            include: {
              course: true
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  if (students.length === 0) {
    return [];
  }

  // Get attendance data for all students
  const studentIds = students.map(s => s.id);
  
  let sessionWhereClause = {
    isClosed: true,
    startAt: { gte: fromDate, lte: toDate },
    subjectInst: {
      sectionId: sectionId ? { in: [sectionId] } : { in: students.map(s => s.sectionId) },
      ...(subjectId && { subjectId: subjectId })
    }
  };

  if (courseId) {
    sessionWhereClause.subjectInst.section = {
      semester: { courseId: courseId }
    };
  }

  // Get attendance logs grouped by student
  const attendanceGroups = await prisma.attendanceLog.groupBy({
    by: ['studentId'],
    where: {
      studentId: { in: studentIds },
      status: 'PRESENT',
      timestamp: { gte: fromDate, lte: toDate },
      session: {
        subjectInst: {
          sectionId: sectionId ? sectionId : { in: students.map(s => s.sectionId) },
          ...(subjectId && { subjectId: subjectId })
        }
      }
    },
    _count: { studentId: true }
  });

  const presentMap = Object.fromEntries(
    attendanceGroups.map(g => [g.studentId, g._count.studentId])
  );

  // Calculate total sessions per section
  const sectionSessionCounts = await Promise.all(
    [...new Set(students.map(s => s.sectionId))].map(async (secId) => {
      const count = await prisma.classSession.count({
        where: {
          isClosed: true,
          startAt: { gte: fromDate, lte: toDate },
          subjectInst: {
            sectionId: secId,
            ...(subjectId && { subjectId: subjectId })
          }
        }
      });
      return { sectionId: secId, count };
    })
  );

  const sessionCountMap = Object.fromEntries(
    sectionSessionCounts.map(sc => [sc.sectionId, sc.count])
  );

  // Build report
  const report = students.map(student => {
    const presentCount = presentMap[student.id] || 0;
    const totalSessions = sessionCountMap[student.sectionId] || 0;
    const absentCount = totalSessions - presentCount;
    const percentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    return {
      studentId: student.id,
      name: student.name,
      enrollmentNo: student.enrollmentNo,
      admissionYear: student.admissionYear,
      batchYear: student.batchYear,
      section: student.section.name,
      course: student.section.semester.course.name,
      presentCount,
      absentCount,
      totalSessions,
      percentage: Math.round(percentage * 100) / 100
    };
  });

  return report;
}

/**
 * Get comprehensive semester-wide attendance report
 * 
 * @param {object} filters - { semesterId?: string, courseId?: string, from?: Date, to?: Date }
 * @returns {Promise<object>} Comprehensive semester report
 */
export async function getSemesterReport(filters) {
  const { semesterId, courseId, from, to } = filters;
  
  // Default to current month if no dates provided
  let fromDate = from ? new Date(from) : new Date();
  let toDate = to ? new Date(to) : new Date();
  
  if (!from && !to) {
    fromDate.setDate(1);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
    toDate.setHours(23, 59, 59, 999);
  } else {
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate.setUTCHours(23, 59, 59, 999);
  }

  // Build semester filter
  let semesterWhere = {};
  if (semesterId) semesterWhere.id = semesterId;
  if (courseId) semesterWhere.courseId = courseId;

  // Get all sections in the semester(s)
  const sections = await prisma.section.findMany({
    where: {
      semester: semesterWhere
    },
    include: {
      semester: {
        include: {
          course: true
        }
      },
      students: true,
      _count: {
        select: {
          students: true
        }
      }
    }
  });

  if (sections.length === 0) {
    return { sections: [], summary: { totalStudents: 0, totalSections: 0 } };
  }

  // Get attendance summary for each section
  const sectionReports = await Promise.all(
    sections.map(async (section) => {
      const sectionReport = await getReport({
        sectionId: section.id,
        from: fromDate,
        to: toDate
      });

      const totalStudents = section._count.students;
      const avgAttendance = sectionReport.length > 0 
        ? sectionReport.reduce((sum, student) => sum + student.percentage, 0) / sectionReport.length
        : 0;

      return {
        sectionId: section.id,
        sectionName: section.name,
        semester: section.semester.name,
        course: section.semester.course.name,
        totalStudents,
        avgAttendance: Math.round(avgAttendance * 100) / 100,
        students: sectionReport
      };
    })
  );

  // Calculate overall summary
  const totalStudents = sections.reduce((sum, section) => sum + section._count.students, 0);
  const overallAvgAttendance = sectionReports.length > 0
    ? sectionReports.reduce((sum, section) => sum + section.avgAttendance, 0) / sectionReports.length
    : 0;

  return {
    summary: {
      totalSections: sections.length,
      totalStudents,
      avgAttendance: Math.round(overallAvgAttendance * 100) / 100,
      dateRange: { from: fromDate, to: toDate }
    },
    sections: sectionReports.sort((a, b) => a.sectionName.localeCompare(b.sectionName))
  };
}

/**
 * Export attendance report to Excel format
 * 
 * @param {Array} reportData - Report data to export
 * @param {string} reportType - Type of report ('student', 'batch', 'section', 'semester')
 * @param {object} metadata - Additional report metadata
 * @returns {Promise<Buffer>} Excel file buffer
 */
export async function exportToExcel(reportData, reportType, metadata = {}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  // Add title and metadata
  worksheet.addRow([`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Attendance Report`]);
  worksheet.addRow([]);
  
  if (metadata.dateRange) {
    worksheet.addRow([`Period: ${metadata.dateRange.from.toDateString()} to ${metadata.dateRange.to.toDateString()}`]);
  }
  
  if (metadata.course) {
    worksheet.addRow([`Course: ${metadata.course}`]);
  }
  
  if (metadata.section) {
    worksheet.addRow([`Section: ${metadata.section}`]);
  }
  
  if (metadata.batch) {
    worksheet.addRow([`Batch: ${metadata.batch}`]);
  }
  
  worksheet.addRow([]);

  // Add headers based on report type
  let headers = [];
  if (reportType === 'student') {
    headers = ['Subject', 'Present', 'Absent', 'Total Classes', 'Percentage'];
    worksheet.addRow(headers);
    
    if (reportData.subjectBreakdown) {
      reportData.subjectBreakdown.forEach(subject => {
        worksheet.addRow([
          subject.subjectName,
          subject.presentCount,
          subject.absentCount,
          subject.totalSessions,
          `${subject.percentage}%`
        ]);
      });
    }
  } else {
    headers = ['Name', 'Enrollment No', 'Section', 'Present', 'Absent', 'Total Classes', 'Percentage'];
    if (reportType === 'batch') {
      headers.splice(3, 0, 'Batch', 'Admission Year');
    }
    worksheet.addRow(headers);

    const dataArray = Array.isArray(reportData) ? reportData : reportData.sections?.flatMap(s => s.students) || [];
    dataArray.forEach(student => {
      const row = [
        student.name,
        student.enrollmentNo,
        student.section || student.sectionName,
        student.presentCount,
        student.absentCount,
        student.totalSessions || student.totalClassesOccurred,
        `${student.percentage}%`
      ];
      
      if (reportType === 'batch') {
        row.splice(3, 0, student.batchYear || 'N/A', student.admissionYear || 'N/A');
      }
      
      worksheet.addRow(row);
    });
  }

  // Style the headers
  const headerRow = worksheet.getRow(worksheet.rowCount - (Array.isArray(reportData) ? reportData.length : 0));
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 15;
  });

  return await workbook.xlsx.writeBuffer();
}
