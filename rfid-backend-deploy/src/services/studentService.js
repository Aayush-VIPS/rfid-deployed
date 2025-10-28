// rfid-attendance-system/apps/backend/src/services/studentService.js
import createError from 'http-errors';
import ExcelJS from 'exceljs';
import prisma from './prisma.js'; // Our centralized Prisma client

/**
 * Creates a new student.
 * @param {object} data - { name, enrollmentNo, rfidUid, sectionId }
 * @returns {Promise<object>} Created student data.
 */
async function createStudent(data) {
    const { name, enrollmentNo, rfidUid, sectionId } = data;

    if (!name || !enrollmentNo || !rfidUid || !sectionId) {
        throw createError(400, 'Name, enrollment number, RFID UID, and section ID are required.');
    }

    // ✅ FIXED: Convert sectionId to string instead of parseInt
    const stringSectionId = String(sectionId);

    // Check for uniqueness
    const existingEnrollment = await prisma.student.findUnique({ where: { enrollmentNo } });
    if (existingEnrollment) {
        throw createError(409, 'Student with this enrollment number already exists.');
    }
    
    const existingRfid = await prisma.student.findUnique({ where: { rfidUid } });
    if (existingRfid) {
        throw createError(409, 'Student with this RFID UID already exists.');
    }

    try {
        const newStudent = await prisma.student.create({
            data: {
                name,
                enrollmentNo,
                rfidUid,
                sectionId: stringSectionId, // ✅ FIXED: Use string sectionId
            },
            include: { section: true }
        });
        return newStudent;
    } catch (error) {
        console.error('Error creating student:', error);
        if (error.code === 'P2003') { // Foreign key constraint violation
            throw createError(400, 'Invalid sectionId provided.');
        }
        throw createError(500, 'Failed to create student due to a database error.');
    }
}

/**
 * Retrieves all students with their associated section.
 * @returns {Promise<Array<object>>} List of all students.
 */
async function getAllStudents() {
    return prisma.student.findMany({
        include: {
            section: {
                include: {
                    semester: {
                        include: {
                            course: true // CRITICAL: Include course here
                        }
                    }
                }
            }
        },
        orderBy: { name: 'asc' },
    });
}

/**
 * Updates an existing student.
 * @param {string} studentId - The ID of the student to update.
 * @param {object} data - { name, enrollmentNo, email, phone, rfidUid, sectionId }
 * @returns {Promise<object>} Updated student data.
 */
async function updateStudent(studentId, data) {
    const { name, enrollmentNo, rfidUid, sectionId } = data;

    // ✅ FIXED: Convert studentId to string
    const stringStudentId = String(studentId);

    const student = await prisma.student.findUnique({ where: { id: stringStudentId } }); // ✅ FIXED: Use string ID
    if (!student) {
        throw createError(404, 'Student not found.');
    }

    // Check for uniqueness violations on update
    if (enrollmentNo) {
        const existingEnrollment = await prisma.student.findUnique({ where: { enrollmentNo } });
        if (existingEnrollment && existingEnrollment.id !== stringStudentId) { // ✅ FIXED: Use string ID for comparison
            throw createError(409, 'Another student with this enrollment number already exists.');
        }
    }
    
    if (rfidUid) {
        const existingRfid = await prisma.student.findUnique({ where: { rfidUid } });
        if (existingRfid && existingRfid.id !== stringStudentId) { // ✅ FIXED: Use string ID for comparison
            throw createError(409, 'Another student with this RFID UID already exists.');
        }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (enrollmentNo) updateData.enrollmentNo = enrollmentNo;
    if (rfidUid) updateData.rfidUid = rfidUid;
    if (sectionId) updateData.sectionId = String(sectionId); // ✅ FIXED: Convert to string instead of parseInt

    try {
        const updatedStudent = await prisma.student.update({
            where: { id: stringStudentId }, // ✅ FIXED: Use string ID
            data: updateData,
            include: { section: true }
        });
        return updatedStudent;
    } catch (error) {
        console.error('Error updating student:', error);
        if (error.code === 'P2025') { // Not found
            throw createError(404, 'Student not found.');
        }
        if (error.code === 'P2003') { // Foreign key constraint violation
            throw createError(400, 'Invalid sectionId provided for update.');
        }
        throw createError(500, 'Failed to update student due to a database error.');
    }
}

/**
 * Deletes a student.
 * @param {string} studentId - The ID of the student to delete.
 */
async function deleteStudent(studentId) {
    // ✅ FIXED: Convert studentId to string
    const stringStudentId = String(studentId);

    try {
        await prisma.student.delete({ where: { id: stringStudentId } }); // ✅ FIXED: Use string ID
    } catch (error) {
        console.error('Error deleting student:', error);
        if (error.code === 'P2025') { // Not found
            throw createError(404, 'Student not found.');
        }
        if (error.code === 'P2003') { // Foreign key constraint violation (e.g., attendance logs linked)
            throw createError(409, 'Cannot delete student: attendance records are linked. Please delete associated data first.');
        }
        throw createError(500, 'Failed to delete student due to a database error.');
    }
}

/**
 * Bulk creates students from Excel file.
 * @param {Buffer} fileBuffer - The Excel file buffer
 * @param {string} mimeType - The MIME type of the file
 * @param {string} courseId - The course ID
 * @param {string} semesterId - The semester ID  
 * @param {string} sectionId - The section ID
 * @returns {Promise<object>} Import results with success/failure counts
 */
async function bulkCreateStudentsFromExcel(fileBuffer, mimeType, courseId, semesterId, sectionId) {
    const stringCourseId = String(courseId);
    const stringSemesterId = String(semesterId);
    const stringSectionId = String(sectionId);
    
    // Verify section exists and belongs to the correct semester/course
    const section = await prisma.section.findFirst({
        where: { 
            id: stringSectionId,
            semesterId: stringSemesterId,
            semester: { courseId: stringCourseId }
        }
    });

    if (!section) {
        throw createError(400, 'Invalid section or section does not belong to the specified course/semester');
    }

    try {
        const students = await parseExcelFile(fileBuffer, mimeType);
        
        if (!students || students.length === 0) {
            throw createError(400, 'No valid student data found in the file');
        }

        const results = {
            successCount: 0,
            failureCount: 0,
            errors: [],
            duplicates: []
        };

        // Get existing enrollment numbers and RFID UIDs for duplicate checking
        const existingStudents = await prisma.student.findMany({
            select: { enrollmentNo: true, rfidUid: true }
        });
        
        const existingEnrollments = new Set(existingStudents.map(s => s.enrollmentNo));
        const existingRfidUids = new Set(existingStudents.map(s => s.rfidUid));

        // Process students in batches to avoid overwhelming the database
        const batchSize = 50;
        const studentsToCreate = [];

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const rowNum = i + 2; // Excel row number (assuming header in row 1)

            // Validate required fields
            if (!student.name || !student.enrollmentNo || !student.rfidUid) {
                results.errors.push(`Row ${rowNum}: Missing required fields (name, enrollmentNo, or rfidUid)`);
                results.failureCount++;
                continue;
            }

            // Check for duplicates
            if (existingEnrollments.has(student.enrollmentNo)) {
                results.duplicates.push(`Row ${rowNum}: Enrollment number ${student.enrollmentNo} already exists`);
                results.failureCount++;
                continue;
            }

            if (existingRfidUids.has(student.rfidUid)) {
                results.duplicates.push(`Row ${rowNum}: RFID UID ${student.rfidUid} already exists`);
                results.failureCount++;
                continue;
            }

            // Add to our tracking sets to prevent duplicates within this batch
            existingEnrollments.add(student.enrollmentNo);
            existingRfidUids.add(student.rfidUid);

            studentsToCreate.push({
                name: student.name.trim(),
                enrollmentNo: student.enrollmentNo.trim(),
                rfidUid: student.rfidUid.trim(),
                sectionId: stringSectionId
            });
        }

        // Batch create students
        if (studentsToCreate.length > 0) {
            for (let i = 0; i < studentsToCreate.length; i += batchSize) {
                const batch = studentsToCreate.slice(i, i + batchSize);
                try {
                    await prisma.student.createMany({
                        data: batch,
                        skipDuplicates: true
                    });
                    results.successCount += batch.length;
                } catch (error) {
                    console.error('Batch create error:', error);
                    // If batch fails, try individual creates to identify specific failures
                    for (const studentData of batch) {
                        try {
                            await prisma.student.create({ data: studentData });
                            results.successCount++;
                        } catch (individualError) {
                            results.errors.push(`Failed to create student ${studentData.enrollmentNo}: ${individualError.message}`);
                            results.failureCount++;
                        }
                    }
                }
            }
        }

        return results;
    } catch (error) {
        console.error('Excel import service error:', error);
        throw error;
    }
}

/**
 * Parses Excel file and extracts student data
 * @param {Buffer} fileBuffer - The Excel file buffer
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<Array>} Array of student objects
 */
async function parseExcelFile(fileBuffer, mimeType) {
    const workbook = new ExcelJS.Workbook();
    
    try {
        // Handle different file types
        if (mimeType === 'text/csv') {
            // For CSV files, we need to parse manually
            return parseCSVFile(fileBuffer);
        } else {
            await workbook.xlsx.load(fileBuffer);
            
            const worksheet = workbook.getWorksheet(1); // Get first worksheet
            
            if (!worksheet) {
                throw new Error('No worksheet found in the file');
            }

            const students = [];
            const headers = {};
            
            // Read headers from first row
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell, colNumber) => {
                const headerValue = cell.value ? String(cell.value).toLowerCase().trim() : '';
                
                // Map common header variations
                if (headerValue.includes('name')) headers.name = colNumber;
                else if (headerValue.includes('enrollment') || headerValue.includes('roll')) headers.enrollmentNo = colNumber;
                else if (headerValue.includes('rfid') || headerValue.includes('uid') || headerValue.includes('card')) headers.rfidUid = colNumber;
            });

            // Validate required headers
            if (!headers.name || !headers.enrollmentNo || !headers.rfidUid) {
                const missingHeaders = [];
                if (!headers.name) missingHeaders.push('name');
                if (!headers.enrollmentNo) missingHeaders.push('enrollment number');
                if (!headers.rfidUid) missingHeaders.push('RFID UID');
                throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Expected headers: Name, Enrollment Number, RFID UID`);
            }

            // Read data rows (starting from row 2)
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header row
                
                const student = {};
                
                // Extract data based on header positions
                if (headers.name) {
                    const nameCell = row.getCell(headers.name);
                    student.name = nameCell.value ? String(nameCell.value).trim() : '';
                }
                
                if (headers.enrollmentNo) {
                    const enrollmentCell = row.getCell(headers.enrollmentNo);
                    student.enrollmentNo = enrollmentCell.value ? String(enrollmentCell.value).trim() : '';
                }
                
                if (headers.rfidUid) {
                    const rfidCell = row.getCell(headers.rfidUid);
                    student.rfidUid = rfidCell.value ? String(rfidCell.value).trim() : '';
                }

                // Only add rows with required fields
                if (student.name && student.enrollmentNo && student.rfidUid) {
                    students.push(student);
                }
            });

            return students;
        }
    } catch (error) {
        console.error('Excel parsing error:', error);
        throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
}

/**
 * Parses CSV file and extracts student data
 * @param {Buffer} fileBuffer - The CSV file buffer
 * @returns {Promise<Array>} Array of student objects
 */
async function parseCSVFile(fileBuffer) {
    const csvContent = fileBuffer.toString('utf8');
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
    }

    const students = [];
    const headers = {};
    
    // Parse header row
    const headerLine = lines[0];
    const headerCells = headerLine.split(',').map(cell => cell.trim().replace(/['"]/g, ''));
    
    // Map headers to column indices
    headerCells.forEach((header, index) => {
        const headerValue = header.toLowerCase().trim();
        if (headerValue.includes('name')) headers.name = index;
        else if (headerValue.includes('enrollment') || headerValue.includes('roll')) headers.enrollmentNo = index;
        else if (headerValue.includes('rfid') || headerValue.includes('uid') || headerValue.includes('card')) headers.rfidUid = index;
    });

    // Validate required headers
    if (!headers.hasOwnProperty('name') || !headers.hasOwnProperty('enrollmentNo') || !headers.hasOwnProperty('rfidUid')) {
        const missingHeaders = [];
        if (!headers.hasOwnProperty('name')) missingHeaders.push('name');
        if (!headers.hasOwnProperty('enrollmentNo')) missingHeaders.push('enrollment number');
        if (!headers.hasOwnProperty('rfidUid')) missingHeaders.push('RFID UID');
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Expected headers: Name, Enrollment Number, RFID UID`);
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cells = line.split(',').map(cell => cell.trim().replace(/['"]/g, ''));
        
        const student = {};
        
        if (cells[headers.name]) student.name = cells[headers.name];
        if (cells[headers.enrollmentNo]) student.enrollmentNo = cells[headers.enrollmentNo];
        if (cells[headers.rfidUid]) student.rfidUid = cells[headers.rfidUid];

        // Only add rows with all required fields
        if (student.name && student.enrollmentNo && student.rfidUid) {
            students.push(student);
        }
    }

    return students;
}

export {
    createStudent,
    getAllStudents,
    updateStudent,
    deleteStudent,
    bulkCreateStudentsFromExcel,
};
