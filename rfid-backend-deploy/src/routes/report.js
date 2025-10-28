// rfid-attendance-system/apps/backend/src/routes/report.js
import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';
import { getReport, getStudentReport, getBatchReport, getSemesterReport, exportToExcel } from '../services/reportService.js';
import createError from 'http-errors';
import { ObjectId } from 'mongodb';

const router = Router();

// Utility function to validate ObjectId
function isValidObjectId(id) {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

/**
 * GET /api/report/student/:id
 * Get comprehensive attendance report for an individual student
 * Query params: from, to, subjectId, courseId
 */
router.get('/student/:id', authenticateToken, authorizeRoles(['ADMIN', 'TEACHER', 'PCOORD']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to, subjectId, courseId } = req.query;

    // Validate student ID
    if (!isValidObjectId(id)) {
      return next(createError(400, 'Invalid student ID format.'));
    }

    // Validate ObjectIds if provided
    if (subjectId && !isValidObjectId(subjectId)) {
      return next(createError(400, 'Invalid subjectId format.'));
    }
    if (courseId && !isValidObjectId(courseId)) {
      return next(createError(400, 'Invalid courseId format.'));
    }

    const filters = { from, to, subjectId, courseId };
    const report = await getStudentReport(id, filters);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/report/section/:sectionId 
 * Fetch attendance report for a section
 * Query params: from, to
 */
router.get('/section/:sectionId', authenticateToken, authorizeRoles(['ADMIN', 'TEACHER', 'PCOORD']), async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { from, to } = req.query;

    // Validate required dates
    if (!from || !to) {
      return next(createError(400, 'Both from and to dates are required.'));
    }

    // Validate ObjectIds if provided
    if (!isValidObjectId(sectionId)) {
      return next(createError(400, 'Invalid sectionId format.'));
    }

    const filters = { sectionId, from, to };
    const report = await getReport(filters);

    res.json({
      success: true,
      data: report,
      filters: filters
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/report/batch
 * Get attendance report for students in specific batch/admission year
 * Query params: batchYear, admissionYear, sectionId, from, to, subjectId, courseId
 */
router.get('/batch', authenticateToken, authorizeRoles(['ADMIN', 'PCOORD']), async (req, res, next) => {
  try {
    const { batchYear, admissionYear, sectionId, from, to, subjectId, courseId } = req.query;

    // Validate required dates
    if (!from || !to) {
      return next(createError(400, 'Both from and to dates are required.'));
    }

    // Must provide either batchYear or admissionYear
    if (!batchYear && !admissionYear) {
      return next(createError(400, 'Either batchYear or admissionYear must be provided.'));
    }

    // Validate ObjectIds if provided
    if (sectionId && !isValidObjectId(sectionId)) {
      return next(createError(400, 'Invalid sectionId format.'));
    }
    if (subjectId && !isValidObjectId(subjectId)) {
      return next(createError(400, 'Invalid subjectId format.'));
    }
    if (courseId && !isValidObjectId(courseId)) {
      return next(createError(400, 'Invalid courseId format.'));
    }

    // Parse admissionYear if provided
    let parsedAdmissionYear;
    if (admissionYear) {
      parsedAdmissionYear = parseInt(admissionYear);
      if (isNaN(parsedAdmissionYear) || parsedAdmissionYear < 2000 || parsedAdmissionYear > 2030) {
        return next(createError(400, 'Invalid admission year. Must be between 2000-2030.'));
      }
    }

    const filters = { 
      batchYear, 
      admissionYear: parsedAdmissionYear, 
      sectionId, 
      from, 
      to, 
      subjectId, 
      courseId 
    };
    const report = await getBatchReport(filters);

    res.json({
      success: true,
      data: report,
      filters: filters
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/report/semester
 * Get comprehensive semester-wide attendance report
 * Query params: semesterId, courseId, from, to
 */
router.get('/semester', authenticateToken, authorizeRoles(['ADMIN', 'PCOORD']), async (req, res, next) => {
  try {
    const { semesterId, courseId, from, to } = req.query;

    // Validate ObjectIds if provided
    if (semesterId && !isValidObjectId(semesterId)) {
      return next(createError(400, 'Invalid semesterId format.'));
    }
    if (courseId && !isValidObjectId(courseId)) {
      return next(createError(400, 'Invalid courseId format.'));
    }

    // Must provide either semesterId or courseId
    if (!semesterId && !courseId) {
      return next(createError(400, 'Either semesterId or courseId must be provided.'));
    }

    const filters = { semesterId, courseId, from, to };
    const report = await getSemesterReport(filters);

    res.json({
      success: true,
      data: report,
      filters: filters
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/report/export
 * Export attendance report to Excel
 * Body: { type, filters, format }
 */
router.post('/export', authenticateToken, authorizeRoles(['ADMIN', 'TEACHER', 'PCOORD']), async (req, res, next) => {
  try {
    const { type, filters, format = 'xlsx' } = req.body;

    if (!type) {
      return next(createError(400, 'Report type is required.'));
    }

    if (!['section', 'student', 'batch', 'semester'].includes(type)) {
      return next(createError(400, 'Invalid report type. Must be: section, student, batch, or semester.'));
    }

    if (format !== 'xlsx') {
      return next(createError(400, 'Only xlsx format is currently supported.'));
    }

    let reportData;
    let metadata = { dateRange: { from: new Date(), to: new Date() } };

    // Generate report based on type
    switch (type) {
      case 'section':
        if (!filters.from || !filters.to) {
          return next(createError(400, 'Date range is required for section reports.'));
        }
        reportData = await getReport(filters);
        metadata = { 
          dateRange: { from: new Date(filters.from), to: new Date(filters.to) },
          section: filters.sectionName,
          course: filters.courseName
        };
        break;
        
      case 'student':
        if (!filters.studentId || !isValidObjectId(filters.studentId)) {
          return next(createError(400, 'Valid student ID is required.'));
        }
        reportData = await getStudentReport(filters.studentId, filters);
        metadata = {
          dateRange: reportData.summary?.dateRange || { from: new Date(), to: new Date() },
          student: reportData.student?.name,
          section: reportData.student?.section
        };
        break;
        
      case 'batch':
        if (!filters.from || !filters.to) {
          return next(createError(400, 'Date range is required for batch reports.'));
        }
        if (!filters.batchYear && !filters.admissionYear) {
          return next(createError(400, 'Either batchYear or admissionYear is required.'));
        }
        reportData = await getBatchReport(filters);
        metadata = {
          dateRange: { from: new Date(filters.from), to: new Date(filters.to) },
          batch: filters.batchYear || `Admission ${filters.admissionYear}`
        };
        break;
        
      case 'semester':
        if (!filters.semesterId && !filters.courseId) {
          return next(createError(400, 'Either semesterId or courseId is required.'));
        }
        reportData = await getSemesterReport(filters);
        metadata = {
          dateRange: reportData.summary?.dateRange || { from: new Date(), to: new Date() },
          course: filters.courseName
        };
        break;
    }

    // Generate Excel buffer
    const excelBuffer = await exportToExcel(reportData, type, metadata);

    // Set response headers for file download
    const filename = `${type}-attendance-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/report/batches
 * Get list of available batches for filtering
 */
router.get('/batches', authenticateToken, authorizeRoles(['ADMIN', 'PCOORD']), async (req, res, next) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Get unique batch years and admission years
    const batches = await prisma.student.findMany({
      select: {
        batchYear: true,
        admissionYear: true
      },
      distinct: ['batchYear', 'admissionYear']
    });

    // Group and organize the data
    const batchYears = [...new Set(batches.map(b => b.batchYear).filter(Boolean))].sort();
    const admissionYears = [...new Set(batches.map(b => b.admissionYear).filter(Boolean))].sort().reverse();

    res.json({
      success: true,
      data: {
        batchYears,
        admissionYears
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
