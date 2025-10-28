// rfid-attendance-system/apps/backend/src/services/semesterService.js
import createError from 'http-errors';
import prisma from './prisma.js'; // Our centralized Prisma client

/**
 * Creates a new semester.
 * @param {object} data - { courseId, number, type }
 * @returns {Promise<object>} Created semester data.
 */
async function createSemester(data) {
    const { courseId, number, type } = data;

    if (!courseId || !number || !type) {
        throw createError(400, 'Course ID, number, and type are required for semester creation.');
    }

    // ✅ FIXED: Convert courseId to string, keep number as integer (not an ObjectId)
    const stringCourseId = String(courseId);
    const parsedNumber = parseInt(number);

    if (isNaN(parsedNumber)) {
        throw createError(400, 'Invalid Semester Number provided.');
    }

    // Check for uniqueness: A course cannot have two semesters with the same number/type (optional, depends on exact uniqueness rule)
    // For simplicity, let's ensure unique (courseId, number) combination.
    const existingSemester = await prisma.semester.findFirst({
        where: {
            courseId: stringCourseId, // ✅ FIXED: Use string courseId
            number: parsedNumber,
        },
    });

    if (existingSemester) {
        throw createError(409, `Semester ${parsedNumber} already exists for course ID ${stringCourseId}.`);
    }

    try {
        const newSemester = await prisma.semester.create({
            data: {
                courseId: stringCourseId, // ✅ FIXED: Use string courseId
                number: parsedNumber,
                type,
            },
            include: { course: true } // Include course details for response
        });
        return newSemester;
    } catch (error) {
        console.error('Error creating semester:', error);
        if (error.code === 'P2003') { // Foreign key constraint violation
            throw createError(400, 'Invalid courseId provided for semester. Course not found.');
        }
        throw createError(500, 'Failed to create semester due to a database error.');
    }
}

/**
 * Retrieves all semesters with their associated courses.
 * @returns {Promise<Array<object>>} List of all semesters.
 */
async function getAllSemesters() {
    return prisma.semester.findMany({
        include: { course: true }, // Include course details
        orderBy: [{ course: { name: 'asc' } }, { number: 'asc' }],
    });
}

/**
 * Updates an existing semester.
 * @param {string} semesterId - The ID of the semester to update.
 * @param {object} data - { courseId?, number?, type? }
 * @returns {Promise<object>} Updated semester data.
 */
async function updateSemester(semesterId, data) {
    const { courseId, number, type } = data;

    // ✅ FIXED: Convert semesterId to string
    const stringSemesterId = String(semesterId);

    // Build update data, converting courseId to string and keeping number as integer
    const updateData = {};
    if (courseId !== undefined && courseId !== null) updateData.courseId = String(courseId); // ✅ FIXED: Use string
    if (number !== undefined && number !== null) updateData.number = parseInt(number); // Keep as integer (not an ObjectId)
    if (type !== undefined && type !== null) updateData.type = type;

    // Check if the semester exists
    const semester = await prisma.semester.findUnique({ where: { id: stringSemesterId } }); // ✅ FIXED: Use string ID
    if (!semester) {
        throw createError(404, 'Semester not found.');
    }

    // Check for uniqueness during update if courseId or number are changed
    if ((courseId !== undefined && String(courseId) !== semester.courseId) || (number !== undefined && parseInt(number) !== semester.number)) {
        const newCourseId = updateData.courseId || semester.courseId;
        const newNumber = updateData.number || semester.number;
        const existingConflict = await prisma.semester.findFirst({
            where: {
                courseId: newCourseId,
                number: newNumber,
                NOT: { id: stringSemesterId }, // ✅ FIXED: Use string ID
            },
        });
        if (existingConflict) {
            throw createError(409, `Semester ${newNumber} already exists for course ID ${newCourseId}.`);
        }
    }

    try {
        const updatedSemester = await prisma.semester.update({
            where: { id: stringSemesterId }, // ✅ FIXED: Use string ID
            data: updateData,
            include: { course: true }
        });
        return updatedSemester;
    } catch (error) {
        console.error('Error updating semester:', error);
        if (error.code === 'P2025') { // Not found
            throw createError(404, 'Semester not found.');
        }
        if (error.code === 'P2003') { // Foreign key constraint violation (invalid courseId)
            throw createError(400, 'Invalid courseId provided for semester update. Course not found.');
        }
        throw createError(500, 'Failed to update semester due to a database error.');
    }
}

/**
 * Deletes a semester.
 * @param {string} semesterId - The ID of the semester to delete.
 */
async function deleteSemester(semesterId) {
    // ✅ FIXED: Convert semesterId to string
    const stringSemesterId = String(semesterId);

    try {
        await prisma.semester.delete({ where: { id: stringSemesterId } }); // ✅ FIXED: Use string ID
    } catch (error) {
        console.error('Error deleting semester:', error);
        if (error.code === 'P2025') { // Not found
            throw createError(404, 'Semester not found.');
        }
        if (error.code === 'P2003') { // Foreign key constraint violation (e.g., sections linked)
            throw createError(409, 'Cannot delete semester: it is linked to existing sections. Please delete associated sections first.');
        }
        throw createError(500, 'Failed to delete semester due to a database error.');
    }
}

export {
    createSemester,
    getAllSemesters,
    updateSemester,
    deleteSemester,
};
