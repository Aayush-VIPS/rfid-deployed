// rfid-attendance-system/apps/backend/src/services/courseService.js
import createError from 'http-errors';
import prisma from './prisma.js'; // Our centralized Prisma client

/**
 * Creates a new course.
 * @param {object} data - { name, departmentId, durationYears, degreeType }
 * @returns {Promise<object>} Created course data.
 */
async function createCourse(data) {
    const { name, departmentId, durationYears, degreeType } = data;

    if (!name || !departmentId || !durationYears || !degreeType) {
        throw createError(400, 'Name, department ID, duration, and degree type are required.');
    }

    // ✅ Convert departmentId to string and validate durationYears as integer
    const stringDepartmentId = String(departmentId);
    const parsedDurationYears = parseInt(durationYears);

    if (isNaN(parsedDurationYears)) {
        throw createError(400, 'Invalid duration years provided.');
    }

    const existingCourse = await prisma.course.findFirst({ 
        where: { 
            name, 
            departmentId: stringDepartmentId
        } 
    });
    
    if (existingCourse) {
        throw createError(409, 'Course with this name already exists in this department.');
    }

    try {
        const newCourse = await prisma.course.create({
            data: {
                name,
                departmentId: stringDepartmentId,
                durationYears: parsedDurationYears,
                degreeType,
            },
            include: { department: true }
        });
        return newCourse;
    } catch (error) {
        console.error('Error creating course:', error);
        if (error.code === 'P2003') {
            throw createError(400, 'Invalid departmentId provided.');
        }
        throw createError(500, 'Failed to create course due to a database error.');
    }
}

/**
 * Retrieves all courses with their associated department.
 * @returns {Promise<Array<object>>} List of all courses.
 */
async function getAllCourses() {
    return prisma.course.findMany({
        include: { department: true },
        orderBy: { name: 'asc' },
    });
}

/**
 * Updates an existing course.
 * @param {string} courseId - The ID of the course to update.
 * @param {object} data - { name, departmentId, durationYears, degreeType }
 * @returns {Promise<object>} Updated course data.
 */
async function updateCourse(courseId, data) {
    const { name, departmentId, durationYears, degreeType } = data;

    // ✅ Convert courseId to string
    const stringCourseId = String(courseId);

    const updateData = {};
    if (name) updateData.name = name;
    if (departmentId) updateData.departmentId = String(departmentId);
    if (durationYears) updateData.durationYears = parseInt(durationYears);
    if (degreeType) updateData.degreeType = degreeType;

    try {
        const updatedCourse = await prisma.course.update({
            where: { id: stringCourseId },
            data: updateData,
            include: { department: true }
        });
        return updatedCourse;
    } catch (error) {
        console.error('Error updating course:', error);
        if (error.code === 'P2025') {
            throw createError(404, 'Course not found.');
        }
        if (error.code === 'P2002') {
            throw createError(409, 'Course with this name already exists in this department.');
        }
        throw createError(500, 'Failed to update course due to a database error.');
    }
}

/**
 * Deletes a course and all its dependent records.
 * @param {string} courseId - The ID of the course to delete.
 */
async function deleteCourse(courseId) {
    // ✅ Convert courseId to string
    const stringCourseId = String(courseId);
    
    console.log(`Service: Attempting to delete course with ID: ${stringCourseId}`);

    try {
        // First, check if the course exists
        const existingCourse = await prisma.course.findUnique({
            where: { id: stringCourseId },
            include: {
                semesters: {
                    include: {
                        sections: {
                            include: {
                                students: { select: { id: true } },
                                instances: { select: { id: true } } // ✅ FIXED: Changed from 'subjectInstances' to 'instances'
                            }
                        }
                    }
                }
            }
        });

        if (!existingCourse) {
            console.log(`Course not found: ${stringCourseId}`);
            throw createError(404, 'Course not found.');
        }

        console.log(`Found course: ${existingCourse.name}`);
        console.log(`Course has ${existingCourse.semesters.length} semesters`);

        // Use a transaction to delete everything in the correct order
        await prisma.$transaction(async (tx) => {
            // Get all semester IDs for this course
            const semesterIds = existingCourse.semesters.map(s => s.id);
            
            if (semesterIds.length > 0) {
                // Get all section IDs for these semesters
                const sections = await tx.section.findMany({
                    where: { semesterId: { in: semesterIds } },
                    select: { id: true }
                });
                const sectionIds = sections.map(s => s.id);

                if (sectionIds.length > 0) {
                    // Get all subject instance IDs for these sections
                    // ✅ FIXED: Use the correct model name based on your schema
                    const subjectInstances = await tx.subjectInstance.findMany({
                        where: { sectionId: { in: sectionIds } },
                        select: { id: true }
                    });
                    const subjectInstanceIds = subjectInstances.map(si => si.id);

                    if (subjectInstanceIds.length > 0) {
                        // 1. Delete all attendance logs for sessions of these subject instances
                        await tx.attendanceLog.deleteMany({
                            where: {
                                session: {
                                    subjectInstId: { in: subjectInstanceIds }
                                }
                            }
                        });

                        // 2. Delete all class sessions for these subject instances
                        const deletedSessions = await tx.classSession.deleteMany({
                            where: {
                                subjectInstId: { in: subjectInstanceIds }
                            }
                        });

                        // 3. Delete all scheduled classes for these subject instances
                        const deletedScheduledClasses = await tx.scheduledClass.deleteMany({
                            where: {
                                subjectInstId: { in: subjectInstanceIds }
                            }
                        });

                        console.log(`Deleted ${deletedSessions.count} sessions and ${deletedScheduledClasses.count} scheduled classes`);
                    }

                    // 4. Delete all students in these sections
                    const deletedStudents = await tx.student.deleteMany({
                        where: { sectionId: { in: sectionIds } }
                    });

                    // 5. Delete all subject instances for these sections
                    const deletedSubjectInstances = await tx.subjectInstance.deleteMany({
                        where: { sectionId: { in: sectionIds } }
                    });

                    // 6. Delete all sections for these semesters
                    const deletedSections = await tx.section.deleteMany({
                        where: { semesterId: { in: semesterIds } }
                    });

                    console.log(`Deleted ${deletedStudents.count} students, ${deletedSubjectInstances.count} subject instances, ${deletedSections.count} sections`);
                }

                // 7. Delete all semester-subject associations for these semesters
                const deletedSemesterSubjects = await tx.semesterSubject.deleteMany({
                    where: { semesterId: { in: semesterIds } }
                });

                // 8. Delete all semesters for this course
                const deletedSemesters = await tx.semester.deleteMany({
                    where: { courseId: stringCourseId }
                });

                console.log(`Deleted ${deletedSemesterSubjects.count} semester-subject associations and ${deletedSemesters.count} semesters`);
            }

            // 9. Finally delete the course itself
            await tx.course.delete({
                where: { id: stringCourseId }
            });

            console.log(`Successfully deleted course: ${stringCourseId}`);
        });

    } catch (error) {
        console.error('Detailed error in deleteCourse:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });

        if (error.code === 'P2025') {
            throw createError(404, 'Course not found.');
        }
        
        // Re-throw createError instances as-is
        if (error.status || error.statusCode) {
            throw error;
        }
        
        // For any other database errors
        throw createError(500, `Failed to delete course due to a database error: ${error.message}`);
    }
}

/**
 * Helper to get all departments for dropdowns.
 */
async function getAllDepartments() {
    return prisma.department.findMany({ orderBy: { name: 'asc' } });
}

export {
    createCourse,
    getAllCourses,
    updateCourse,
    deleteCourse,
    getAllDepartments,
};
