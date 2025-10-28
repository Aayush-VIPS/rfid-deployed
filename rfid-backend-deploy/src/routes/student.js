// rfid-attendance-system/apps/backend/src/routes/student.js
import express from 'express';
import createError from 'http-errors';
import multer from 'multer';
import { ObjectId } from 'mongodb'; // ✅ ADDED: Import for ObjectId validation
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';
import {
    createStudent,
    getAllStudents,
    updateStudent,
    deleteStudent,
    bulkCreateStudentsFromExcel,
} from '../services/studentService.js';
// CRITICAL: Correct import for getAllSections from scheduledClassService.js
import { getAllSections } from '../services/scheduledClassService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
        }
    }
});

// All student management routes require ADMIN or PCOORD roles
router.use(authenticateToken, authorizeRoles(['ADMIN', 'PCOORD']));

/**
 * @route POST /api/student
 * @desc Create a new student.
 * @access Private (ADMIN, PCOORD)
 */
router.post('/', async (req, res, next) => {
    try {
        const newStudent = await createStudent(req.body);
        res.status(201).json({ message: 'Student created successfully.', student: newStudent });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/student
 * @desc Get all students with section details.
 * @access Private (ADMIN, PCOORD)
 */
router.get('/', async (req, res, next) => {
    try {
        const students = await getAllStudents();
        res.status(200).json(students);
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/student/:studentId
 * @desc Update an existing student.
 * @access Private (ADMIN, PCOORD)
 */
router.put('/:studentId', async (req, res, next) => {
    // ✅ FIXED: Use ObjectId validation instead of parseInt
    const studentId = req.params.studentId;
    if (!studentId || !ObjectId.isValid(studentId)) {
        return next(createError(400, 'Invalid student ID.'));
    }
    
    try {
        const updatedStudent = await updateStudent(studentId, req.body);
        res.status(200).json({ message: 'Student updated successfully.', student: updatedStudent });
    } catch (error) {
        next(error);
    }
});

/**
 * @route DELETE /api/student/:studentId
 * @desc Delete a student.
 * @access Private (ADMIN, PCOORD)
 */
router.delete('/:studentId', async (req, res, next) => {
    // ✅ FIXED: Use ObjectId validation instead of parseInt
    const studentId = req.params.studentId;
    if (!studentId || !ObjectId.isValid(studentId)) {
        return next(createError(400, 'Invalid student ID.'));
    }
    
    try {
        await deleteStudent(studentId);
        res.status(204).send(); // No content on successful delete
    } catch (error) {
        next(error);
    }
});

// --- Helper Endpoint for Sections ---
/**
 * @route GET /api/student/helpers/sections
 * @desc Get all sections for dropdowns (for student assignment).
 * @access Private (ADMIN, PCOORD)
 */
router.get('/helpers/sections', authenticateToken, authorizeRoles(['ADMIN', 'PCOORD']), async (req, res, next) => {
    try {
        const sections = await getAllSections(); // Call the imported helper
        res.status(200).json(sections);
    } catch (error) {
        console.error('Error fetching sections for student helper:', error);
        next(error);
    }
});

// Import students from Excel/CSV
router.post('/import-excel', 
    authenticateToken, 
    authorizeRoles(['ADMIN', 'PCOORD']),
    upload.single('file'),
    async (req, res, next) => {
        try {
            const { courseId, semesterId, sectionId } = req.body;
            
            // Validate required parameters
            if (!courseId || !semesterId || !sectionId) {
                return next(createError(400, 'Course ID, Semester ID, and Section ID are required'));
            }

            if (!req.file) {
                return next(createError(400, 'No file uploaded'));
            }

            // Validate ObjectIds
            if (!ObjectId.isValid(courseId) || !ObjectId.isValid(semesterId) || !ObjectId.isValid(sectionId)) {
                return next(createError(400, 'Invalid Course ID, Semester ID, or Section ID format'));
            }

            const result = await bulkCreateStudentsFromExcel(
                req.file.buffer, 
                req.file.mimetype, 
                courseId, 
                semesterId, 
                sectionId
            );
            
            res.status(201).json({
                success: true,
                message: `Successfully imported ${result.successCount} students`,
                data: {
                    successCount: result.successCount,
                    failureCount: result.failureCount,
                    errors: result.errors,
                    duplicates: result.duplicates
                }
            });
        } catch (error) {
            console.error('Excel import error:', error);
            if (error.message.includes('parsing') || error.message.includes('format')) {
                return next(createError(400, error.message));
            }
            next(error);
        }
    }
);

export default router;
