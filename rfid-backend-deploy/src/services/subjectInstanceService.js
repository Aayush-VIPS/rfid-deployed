// rfid-attendance-system/apps/backend/src/services/subjectInstanceService.js
import createError from 'http-errors';
import prisma from './prisma.js';

/**
 * Creates a new SubjectInstance, linking a subject, section, and faculty.
 * @param {object} data - { subjectId, sectionId, facultyId }
 * @returns {Promise<Object>} Created SubjectInstance data.
 */
async function createSubjectInstance(data) {
    const { subjectId, sectionId, facultyId } = data;

    if (!subjectId || !sectionId || !facultyId) {
        throw createError(400, 'Subject ID, Section ID, and Faculty ID are required to create a subject instance.');
    }

    // Convert to strings instead of parsing to integers
    const stringSubjectId = String(subjectId);
    const stringSectionId = String(sectionId);
    const stringFacultyId = String(facultyId);

    const existingInstance = await prisma.subjectInstance.findUnique({
        where: {
            subjectId_sectionId_facultyId: {
                subjectId: stringSubjectId,
                sectionId: stringSectionId,
                facultyId: stringFacultyId,
            },
        },
    });

    if (existingInstance) {
        throw createError(409, 'This subject is already assigned to this section by this faculty member.');
    }

    try {
        const newInstance = await prisma.subjectInstance.create({
            data: {
                subjectId: stringSubjectId,
                sectionId: stringSectionId,
                facultyId: stringFacultyId,
            },
            include: {
                subject: true,
                section: {
                    include: {
                        semester: {
                            include: {
                                course: true
                            }
                        }
                    }
                },
                faculty: { select: { id: true, name: true, empId: true } }
            }
        });

        return newInstance;
    } catch (error) {
        console.error('Error creating subject instance:', error);
        if (error.code === 'P2003') {
            throw createError(400, 'Invalid Subject ID, Section ID, or Faculty ID provided. Related entity not found.');
        }
        throw createError(500, 'Failed to create subject instance due to a database error.');
    }
}

/**
 * Retrieves all SubjectInstances and sorts them in the application code.
 * @returns {Promise<Array<Object>>} List of all SubjectInstance objects.
 */
async function getAllSubjectInstances() {
    const instances = await prisma.subjectInstance.findMany({
        include: {
            subject: true,
            section: {
                include: {
                    semester: {
                        include: {
                            course: true
                        }
                    }
                }
            },
            faculty: { select: { id: true, name: true, empId: true } }
        }
    });

    instances.sort((a, b) => {
        const courseNameA = a.section?.semester?.course?.name || '';
        const courseNameB = b.section?.semester?.course?.name || '';
        if (courseNameA.localeCompare(courseNameB) !== 0) {
            return courseNameA.localeCompare(courseNameB);
        }

        const semesterNumberA = a.section?.semester?.number || 0;
        const semesterNumberB = b.section?.semester?.number || 0;
        if (semesterNumberA - semesterNumberB !== 0) {
            return semesterNumberA - semesterNumberB;
        }

        const sectionNameA = a.section?.name || '';
        const sectionNameB = b.section?.name || '';
        if (sectionNameA.localeCompare(sectionNameB) !== 0) {
            return sectionNameA.localeCompare(sectionNameB);
        }

        const subjectNameA = a.subject?.name || '';
        const subjectNameB = b.subject?.name || '';
        return subjectNameA.localeCompare(subjectNameB);
    });

    return instances;
}

/**
 * Updates an existing SubjectInstance.
 * @param {string} instanceId - The ID of the SubjectInstance to update.
 * @param {object} data - { subjectId?, sectionId?, facultyId? }
 * @returns {Promise<Object>} Updated SubjectInstance data.
 */
async function updateSubjectInstance(instanceId, data) {
    const { subjectId, sectionId, facultyId } = data;

    // Convert instanceId to string
    const stringInstanceId = String(instanceId);

    const updateData = {};
    // Convert all IDs to strings instead of integers
    if (subjectId !== undefined && subjectId !== null) updateData.subjectId = String(subjectId);
    if (sectionId !== undefined && sectionId !== null) updateData.sectionId = String(sectionId);
    if (facultyId !== undefined && facultyId !== null) updateData.facultyId = String(facultyId);

    try {
        const updatedInstance = await prisma.subjectInstance.update({
            where: { id: stringInstanceId },
            data: updateData,
            include: {
                subject: true,
                section: { include: { semester: { include: { course: true } } } },
                faculty: { select: { id: true, name: true, empId: true } }
            }
        });

        return updatedInstance;
    } catch (error) {
        console.error('Error updating subject instance:', error);
        if (error.code === 'P2025') {
            throw createError(404, 'Subject instance not found.');
        }
        if (error.code === 'P2003') {
            throw createError(400, 'Invalid Subject ID, Section ID, or Faculty ID provided for update. Related entity not found.');
        }
        if (error.code === 'P2002') {
            throw createError(409, 'Cannot update: this assignment (Subject, Section, Faculty) already exists.');
        }
        throw createError(500, 'Failed to update subject instance due to a database error.');
    }
}

/**
 * Deletes a SubjectInstance and all its dependent records.
 * @param {string} instanceId - The ID of the SubjectInstance to delete.
 */
async function deleteSubjectInstance(instanceId) {
    const stringInstanceId = String(instanceId);
    
    console.log(`Service: Attempting to delete subject instance with ID: ${stringInstanceId}`);

    try {
        // First, check if the subject instance exists
        const existingInstance = await prisma.subjectInstance.findUnique({
            where: { id: stringInstanceId },
            include: {
                subject: { select: { name: true } },
                section: { select: { name: true } },
                faculty: { select: { name: true } }
            }
        });

        if (!existingInstance) {
            console.log(`Subject instance not found: ${stringInstanceId}`);
            throw createError(404, 'Subject instance not found.');
        }

        console.log(`Found subject instance: ${existingInstance.subject?.name} - ${existingInstance.section?.name} - ${existingInstance.faculty?.name}`);

        // Use a transaction to delete everything in the correct order
        await prisma.$transaction(async (tx) => {
            // 1. Delete all attendance logs for sessions of this subject instance
            await tx.attendanceLog.deleteMany({
                where: {
                    session: {
                        subjectInstId: stringInstanceId
                    }
                }
            });

            // 2. Delete all class sessions for this subject instance
            const deletedSessions = await tx.classSession.deleteMany({
                where: {
                    subjectInstId: stringInstanceId
                }
            });

            // 3. Delete all scheduled classes for this subject instance
            const deletedScheduledClasses = await tx.scheduledClass.deleteMany({
                where: {
                    subjectInstId: stringInstanceId
                }
            });

            // 4. Finally delete the subject instance itself
            await tx.subjectInstance.delete({
                where: { id: stringInstanceId }
            });

            console.log(`Cleanup completed: deleted ${deletedSessions.count} sessions, ${deletedScheduledClasses.count} scheduled classes`);
        });

        console.log(`Successfully deleted subject instance: ${stringInstanceId}`);

    } catch (error) {
        console.error('Detailed error in deleteSubjectInstance:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });

        if (error.code === 'P2025') {
            throw createError(404, 'Subject instance not found.');
        }
        
        // Re-throw createError instances as-is
        if (error.status || error.statusCode) {
            throw error;
        }
        
        // For any other database errors
        throw createError(500, `Failed to delete subject instance due to a database error: ${error.message}`);
    }
}


export {
    createSubjectInstance,
    getAllSubjectInstances,
    updateSubjectInstance,
    deleteSubjectInstance,
};
