// rfid-attendance-system/apps/backend/src/routes/setup.js
import express from 'express';
import createError from 'http-errors';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';
import prisma from '../services/prisma.js';

const router = express.Router();

// Middleware for PCOORD/ADMIN access
router.use(authenticateToken, authorizeRoles(['ADMIN', 'PCOORD']));

/**
 * @route GET /api/setup/status
 * @desc Check if the system has been set up with basic data
 * @access Private (ADMIN, PCOORD)
 */
router.get('/status', async (req, res, next) => {
  try {
    const [departments, courses, subjects, faculty, sections] = await Promise.all([
      prisma.department.count(),
      prisma.course.count(),
      prisma.subject.count(),
      prisma.faculty.count(),
      prisma.section.count()
    ]);

    const hasData = departments > 0 && courses > 0 && subjects > 0;

    res.json({
      hasData,
      departments,
      courses,
      subjects,
      faculty,
      sections
    });
  } catch (error) {
    console.error('Error checking setup status:', error);
    next(error);
  }
});

/**
 * @route POST /api/setup/bulk-create
 * @desc Create academic structure in bulk from wizard data
 * @access Private (ADMIN, PCOORD)
 */
router.post('/bulk-create', async (req, res, next) => {
  const { department, course, semesters, sections, subjects } = req.body;

  if (!department || !course.name || !semesters.length) {
    return next(createError(400, 'Missing required setup data'));
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or Use Department
      let createdDept;
      if (department.id) {
        // Use existing department
        createdDept = await tx.department.findUnique({
          where: { id: department.id }
        });
        if (!createdDept) {
          throw new Error('Selected department not found');
        }
      } else {
        // Create new department
        createdDept = await tx.department.create({
          data: {
            name: department.name,
            code: department.code || department.name.substring(0, 3).toUpperCase()
          }
        });
      }

      // 2. Create Course
      const createdCourse = await tx.course.create({
        data: {
          name: course.name,
          degreeType: course.degreeType,
          durationYears: course.durationYears,
          departmentId: createdDept.id
        }
      });

      // 3. Create Semesters
      const createdSemesters = [];
      for (const semester of semesters) {
        const createdSem = await tx.semester.create({
          data: {
            number: semester.number,
            type: semester.type,
            academicYear: semester.academicYear,
            courseId: createdCourse.id
          }
        });
        createdSemesters.push(createdSem);
      }

      // 4. Create Sections
      const createdSections = [];
      for (const section of sections) {
        const semester = createdSemesters.find(s => s.number === section.semesterNumber);
        if (semester) {
          const createdSec = await tx.section.create({
            data: {
              name: section.name,
              semesterId: semester.id
            }
          });
          createdSections.push(createdSec);
        }
      }

      // 5. Create Subjects
      const createdSubjects = [];
      for (const subject of subjects) {
        if (subject.name && subject.code) {
          const createdSubj = await tx.subject.create({
            data: {
              name: subject.name,
              code: subject.code,
              credits: subject.credits
            }
          });
          createdSubjects.push({ ...createdSubj, semesterNumber: subject.semesterNumber });
        }
      }

      // 6. Create SemesterSubject relationships
      for (const subject of createdSubjects) {
        const semester = createdSemesters.find(s => s.number === subject.semesterNumber);
        if (semester) {
          await tx.semesterSubject.create({
            data: {
              semesterId: semester.id,
              subjectId: subject.id
            }
          });
        }
      }

      return {
        department: createdDept,
        course: createdCourse,
        semesters: createdSemesters,
        sections: createdSections,
        subjects: createdSubjects
      };
    }, {
      timeout: 30000 // 30 seconds timeout
    });

    res.status(201).json({
      message: 'Academic structure created successfully',
      data: {
        departmentsCreated: department.id ? 0 : 1, // 0 if existing dept used
        coursesCreated: 1,
        semestersCreated: result.semesters.length,
        sectionsCreated: result.sections.length,
        subjectsCreated: result.subjects.length
      }
    });

  } catch (error) {
    console.error('Error in bulk setup:', error);
    if (error.code === 'P2002') {
      return next(createError(409, 'Some data already exists. Please check for duplicates.'));
    }
    next(createError(500, 'Failed to create academic structure'));
  }
});

/**
 * @route GET /api/setup/sample-data
 * @desc Get sample data for quick testing
 * @access Private (ADMIN, PCOORD)
 */
router.get('/sample-data', (req, res) => {
  const sampleData = {
    department: { name: 'Computer Science & Engineering', code: 'CSE' },
    course: { name: 'Bachelor of Computer Applications', degreeType: 'UG', durationYears: 3 },
    subjects: [
      // Semester 1
      { name: 'Programming Fundamentals', code: 'CS101', credits: 4, semesterNumber: 1 },
      { name: 'Mathematics I', code: 'MATH101', credits: 3, semesterNumber: 1 },
      { name: 'English Communication', code: 'ENG101', credits: 2, semesterNumber: 1 },
      // Semester 2
      { name: 'Data Structures', code: 'CS102', credits: 4, semesterNumber: 2 },
      { name: 'Mathematics II', code: 'MATH102', credits: 3, semesterNumber: 2 },
      { name: 'Digital Logic', code: 'CS103', credits: 3, semesterNumber: 2 },
      // Semester 3
      { name: 'Object Oriented Programming', code: 'CS201', credits: 4, semesterNumber: 3 },
      { name: 'Database Management', code: 'CS202', credits: 4, semesterNumber: 3 },
      { name: 'Computer Networks', code: 'CS203', credits: 3, semesterNumber: 3 }
    ]
  };

  res.json(sampleData);
});

export default router;