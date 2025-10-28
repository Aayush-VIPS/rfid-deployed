// rfid-attendance-system/apps/backend/src/routes/attendance.js
import express from 'express';
import createError from 'http-errors';
import { ObjectId } from 'mongodb'; // Add this import for ObjectId validation
import ExcelJS from 'exceljs';
import prisma from '../services/prisma.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';
import {
  getAttendanceSnapshot,
  getTeacherAttendanceByClassAndDate,
  getAttendanceReportForSession,
  getAggregatedAttendanceReport,
} from '../services/attendanceService.js';

const router = express.Router();

/**
 * GET /api/attendance/snapshot/:sessionId
 * Real-time attendance snapshot for a session
 */
router.get(
  '/snapshot/:sessionId',
  authenticateToken,
  authorizeRoles(['TEACHER', 'PCOORD', 'ADMIN']),
  async (req, res, next) => {
    // ✅ FIXED: Use ObjectId validation instead of parseInt
    const sessionId = req.params.sessionId;
    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return next(createError(400, 'Invalid session ID.'));
    }

    try {
      const snapshot = await getAttendanceSnapshot(sessionId);
      res.json(snapshot);
    } catch (error) {
      console.error(`Error fetching attendance snapshot for session ${sessionId}:`, error);
      next(error);
    }
  }
);

/**
 * GET /api/attendance/teacher-report
 * Attendance logs for teacher's class on specified date
 */
router.get(
  '/teacher-report',
  authenticateToken,
  authorizeRoles(['TEACHER', 'ADMIN', 'PCOORD']),
  async (req, res, next) => {
    const { facultyId, role } = req.user;
    const { subjectId, sectionId, date } = req.query;

    let targetFacultyId = facultyId;
    if ((role === 'ADMIN' || role === 'PCOORD') && req.query.facultyId) {
      // ✅ FIXED: Use ObjectId validation instead of parseInt
      targetFacultyId = req.query.facultyId;
      if (!ObjectId.isValid(targetFacultyId)) {
        return next(createError(400, 'Invalid facultyId format.'));
      }
    }
    
    if (!targetFacultyId) {
      return next(createError(403, 'Forbidden: faculty profile required or facultyId must be specified.'));
    }
    
    if (!subjectId || !sectionId || !date) {
      return next(createError(400, 'subjectId, sectionId and date are required query parameters.'));
    }
    
    // ✅ FIXED: Use ObjectId validation instead of parseInt
    if (!ObjectId.isValid(subjectId) || !ObjectId.isValid(sectionId)) {
      return next(createError(400, 'Invalid subjectId or sectionId format.'));
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return next(createError(400, 'Date must be in YYYY-MM-DD format.'));
    }

    try {
      const filters = {
        subjectId: subjectId,  // ✅ FIXED: Keep as string
        sectionId: sectionId, // ✅ FIXED: Keep as string
        date,
      };
      const attendanceRecords = await getTeacherAttendanceByClassAndDate(targetFacultyId, filters);
      res.json(attendanceRecords);
    } catch (error) {
      console.error(`Error fetching teacher attendance report for faculty ${targetFacultyId}:`, error);
      next(error);
    }
  }
);

/**
 * GET /api/attendance/export-session/:sessionId/excel
 * Export live session attendance with all students (present and absent) and summary.
 * Columns: S. No., Student Name, Enrollment No., Status (Present/Absent), Scanned At (for present only)
 */
router.get(
  '/export-session/:sessionId/excel',
  authenticateToken,
  authorizeRoles(['TEACHER', 'ADMIN', 'PCOORD']),
  async (req, res, next) => {
    // ✅ FIXED: Use ObjectId validation instead of parseInt
    const sessionId = req.params.sessionId;
    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return next(createError(400, 'Invalid session ID.'));
    }

    try {
      const { presentStudents, absentStudents, totalStudentsInSessionSection, presentCount, absentCount } = await getAttendanceSnapshot(sessionId);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`Session ${sessionId} Attendance`);

      // Add Summary Row
      sheet.addRow(['Attendance Summary']);
      sheet.addRow([`Total Students in Section: ${totalStudentsInSessionSection}`]);
      sheet.addRow([`Present: ${presentCount}`]);
      sheet.addRow([`Absent: ${absentCount}`]);
      sheet.addRow([]); // Blank row for spacing

      // Add column headers
      sheet.columns = [
        { header: 'S. No.', key: 'sno', width: 6 },
        { header: 'Student Name', key: 'name', width: 30 },
        { header: 'Enrollment No.', key: 'enrollmentNo', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Scanned At', key: 'scannedAt', width: 18 }, // Only for present students
      ];

      // Combine present and absent students for unified display, sorted by name
      const allStudentsForReport = [...presentStudents, ...absentStudents].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      allStudentsForReport.forEach((student, idx) => {
        sheet.addRow({
          sno: idx + 1,
          name: student.name,
          enrollmentNo: student.enrollmentNo,
          status: student.status,
          scannedAt: student.timestamp ? new Date(student.timestamp).toLocaleTimeString() : 'N/A',
        });
      });

      const fileName = `attendance_session_report_${sessionId}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error(`Error exporting attendance for session ${sessionId}:`, error);
      next(createError(500, 'Failed to export Excel report.'));
    }
  }
);

/**
 * GET /api/attendance/export-report/:sectionId
 * Export detailed attendance aggregated report with columns:
 * S. No., Student Name, Enrollment No., Present, Absent, Total Classes, %
 * Query params: from, to, optional subjectId
 */
router.get(
  '/export-report/:sectionId',
  authenticateToken,
  authorizeRoles(['TEACHER', 'PCOORD', 'ADMIN']),
  async (req, res, next) => {
    // ✅ FIXED: Use ObjectId validation instead of parseInt
    const sectionId = req.params.sectionId;
    const { from, to, subjectId } = req.query;

    if (!sectionId || !ObjectId.isValid(sectionId) || !from || !to) {
      return next(createError(400, "'sectionId', 'from', and 'to' are required parameters. sectionId must be a valid ObjectId."));
    }

    // ✅ FIXED: Validate subjectId if provided
    if (subjectId && !ObjectId.isValid(subjectId)) {
      return next(createError(400, 'Invalid subjectId format.'));
    }

    try {
      const report = await getAggregatedAttendanceReport({
        sectionId: sectionId, // ✅ FIXED: Keep as string
        from,
        to,
        subjectId: subjectId || undefined, // ✅ FIXED: Keep as string if provided
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Attendance Report');

      sheet.columns = [
        { header: 'S. No.', key: 'sno', width: 6 },
        { header: 'Student Name', key: 'name', width: 30 },
        { header: 'Enrollment No.', key: 'enrollmentNo', width: 20 },
        { header: 'Present', key: 'presentCount', width: 10 },
        { header: 'Absent', key: 'absentCount', width: 10 },
        { header: 'Total Classes Occurred', key: 'totalClassesOccurred', width: 18 },
        { header: '% Attendance', key: 'percentage', width: 12 },
      ];

      report.forEach((student, idx) => {
        sheet.addRow({
          sno: idx + 1,
          name: student.name,
          enrollmentNo: student.enrollmentNo,
          presentCount: student.presentCount,
          absentCount: student.absentCount,
          totalClassesOccurred: student.totalClassesOccurred,
          percentage: student.percentage,
        });
      });

      const fileName = `attendance_report_section_${sectionId}_${from}_to_${to}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error(`Error exporting attendance report for section ${sectionId}:`, error);
      next(createError(500, 'Failed to export Excel report.'));
    }
  }
);

// In your attendance.js routes - corrected device status endpoint
router.get('/session/:sessionId/device-status', 
  authenticateToken, 
  authorizeRoles(['TEACHER', 'ADMIN', 'PCOORD']),
  async (req, res, next) => {
    const { sessionId } = req.params;

    if (!ObjectId.isValid(sessionId)) {
      return res.json({
        isAuthenticated: false,
        authenticatedBy: 'N/A',
        deviceMacAddress: 'N/A',
        message: 'Invalid session ID.',
      });
    }

    try {
      // Get session info first
      const session = await prisma.classSession.findUnique({
        where: { id: sessionId },
        include: {
          teacher: { select: { name: true, id: true } },
          device: { select: { macAddr: true, name: true } }
        },
      });

      if (!session) {
        return res.json({
          isAuthenticated: false,
          authenticatedBy: 'N/A',
          deviceMacAddress: 'N/A',
          message: 'Session not found.',
        });
      }

      // ✅ NEW LOGIC: Query the attendance logs to see if a device is assigned.
      const firstScan = await prisma.attendanceLog.findFirst({
        where: { sessionId: sessionId },
        select: { deviceMacAddress: true },
        orderBy: { timestamp: 'asc' }
      });

      // Check if there's a device associated with this session via logs
      if (!firstScan || !firstScan.deviceMacAddress) {
        return res.json({
          isAuthenticated: false,
          authenticatedBy: 'N/A',
          deviceMacAddress: 'N/A',
          message: 'No device assigned to this session.',
        });
      }

      const deviceMacAddress = firstScan.deviceMacAddress;

      // For now, let's consider a device "authenticated" if:
      // 1. The session has a device associated via a log
      // 2. The session is not closed
      const isAuthenticated = !session.isClosed && !!deviceMacAddress;

      return res.json({
        isAuthenticated,
        authenticatedBy: isAuthenticated ? session.teacher?.name ?? 'Unknown Teacher' : 'N/A',
        deviceMacAddress: deviceMacAddress ?? 'Unknown',
        message: isAuthenticated 
          ? `Device ${deviceMacAddress} is active for this session`
          : 'Session is closed or device not active',
        sessionStatus: session.isClosed ? 'closed' : 'active'
      });

    } catch (err) {
      console.error('Device-status endpoint failed:', err);
      return res.json({
        isAuthenticated: false,
        authenticatedBy: 'N/A',
        deviceMacAddress: 'N/A',
        message: 'Error checking device status.',
      });
    }
  }
);


export default router;