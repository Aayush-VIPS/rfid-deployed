// scripts/assignBatches.js
// Script to assign batch information to existing students

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Assign batch information to students based on enrollment number patterns
 * This script analyzes enrollment numbers and assigns appropriate batch years
 */
async function assignBatchesToStudents() {
  try {
    console.log('Starting batch assignment process...');
    
    // Get all students without batch information
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { batchYear: null },
          { admissionYear: null }
        ]
      },
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

    console.log(`Found ${students.length} students without batch information`);

    if (students.length === 0) {
      console.log('All students already have batch information assigned.');
      return;
    }

    let updatedCount = 0;
    const updates = [];

    for (const student of students) {
      const enrollmentNo = student.enrollmentNo;
      let admissionYear = null;
      let batchYear = null;

      // Try to extract year from enrollment number patterns
      // Common patterns:
      // - 2023XXX, 23XXX (year at the start)
      // - XXX2023, XXX23 (year at the end)
      // - 2023-XXX (year with separator)
      
      // Pattern 1: Year at the start (2023XXX or 23XXX)
      const yearStartMatch = enrollmentNo.match(/^(20\d{2}|\d{2})/);
      if (yearStartMatch) {
        let yearStr = yearStartMatch[1];
        if (yearStr.length === 2) {
          // Convert 2-digit to 4-digit year (assuming 21-30 = 2021-2030, 00-20 = 2000-2020)
          const twoDigitYear = parseInt(yearStr);
          if (twoDigitYear >= 0 && twoDigitYear <= 30) {
            yearStr = '20' + yearStr.padStart(2, '0');
          } else {
            yearStr = '19' + yearStr;
          }
        }
        admissionYear = parseInt(yearStr);
      }

      // Pattern 2: Year at the end (XXX2023 or XXX23)
      if (!admissionYear) {
        const yearEndMatch = enrollmentNo.match(/(20\d{2}|\d{2})$/);
        if (yearEndMatch) {
          let yearStr = yearEndMatch[1];
          if (yearStr.length === 2) {
            const twoDigitYear = parseInt(yearStr);
            if (twoDigitYear >= 0 && twoDigitYear <= 30) {
              yearStr = '20' + yearStr.padStart(2, '0');
            } else {
              yearStr = '19' + yearStr;
            }
          }
          admissionYear = parseInt(yearStr);
        }
      }

      // Pattern 3: Year with separators (2023-XXX, 2023_XXX)
      if (!admissionYear) {
        const separatorMatch = enrollmentNo.match(/(20\d{2})/);
        if (separatorMatch) {
          admissionYear = parseInt(separatorMatch[1]);
        }
      }

      // If we couldn't extract year, try some heuristics based on course duration
      if (!admissionYear) {
        console.log(`Could not determine admission year for student ${student.name} (${enrollmentNo}). Skipping...`);
        continue;
      }

      // Validate admission year (should be reasonable)
      if (admissionYear < 2000 || admissionYear > 2030) {
        console.log(`Invalid admission year ${admissionYear} for student ${student.name} (${enrollmentNo}). Skipping...`);
        continue;
      }

      // Calculate batch year based on course duration
      // Most courses are 3-4 years, we'll assume 4 years for now
      // This can be customized based on actual course data
      let courseDuration = 4; // Default duration

      // Try to get course duration from course name patterns
      const courseName = student.section?.semester?.course?.name?.toLowerCase() || '';
      if (courseName.includes('diploma') || courseName.includes('polytechnic')) {
        courseDuration = 3; // Diploma courses are typically 3 years
      } else if (courseName.includes('master') || courseName.includes('mca') || courseName.includes('mba')) {
        courseDuration = 2; // Master's courses are typically 2 years
      } else if (courseName.includes('phd') || courseName.includes('doctoral')) {
        courseDuration = 5; // PhD courses are typically 5+ years
      }

      batchYear = `${admissionYear}-${admissionYear + courseDuration}`;

      updates.push({
        studentId: student.id,
        admissionYear,
        batchYear,
        name: student.name,
        enrollmentNo: student.enrollmentNo
      });
    }

    console.log(`Prepared ${updates.length} batch assignments`);

    // Show preview of assignments
    console.log('\nPreview of batch assignments:');
    console.log('================================');
    updates.slice(0, 10).forEach(update => {
      console.log(`${update.name} (${update.enrollmentNo}) -> Admission: ${update.admissionYear}, Batch: ${update.batchYear}`);
    });
    if (updates.length > 10) {
      console.log(`... and ${updates.length - 10} more`);
    }

    // Prompt for confirmation (in production, you might want to add readline for interactive confirmation)
    console.log('\nApplying batch assignments...');

    // Apply updates in batches
    for (const update of updates) {
      await prisma.student.update({
        where: { id: update.studentId },
        data: {
          admissionYear: update.admissionYear,
          batchYear: update.batchYear
        }
      });
      updatedCount++;
    }

    console.log(`Successfully assigned batch information to ${updatedCount} students`);

    // Show summary statistics
    const batchSummary = await prisma.student.groupBy({
      by: ['batchYear'],
      where: {
        batchYear: { not: null }
      },
      _count: {
        batchYear: true
      }
    });

    console.log('\nBatch distribution after assignment:');
    console.log('===================================');
    batchSummary.forEach(batch => {
      console.log(`${batch.batchYear}: ${batch._count.batchYear} students`);
    });

  } catch (error) {
    console.error('Error during batch assignment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Manual batch assignment for specific students
 * Usage example: assignManualBatches([
 *   { enrollmentNo: "2023001", admissionYear: 2023, batchYear: "2023-2027" },
 *   { enrollmentNo: "2023002", admissionYear: 2023, batchYear: "2023-2027" }
 * ])
 */
async function assignManualBatches(assignments) {
  try {
    console.log(`Starting manual batch assignment for ${assignments.length} students...`);
    
    let updatedCount = 0;
    
    for (const assignment of assignments) {
      const student = await prisma.student.findUnique({
        where: { enrollmentNo: assignment.enrollmentNo }
      });
      
      if (!student) {
        console.log(`Student with enrollment number ${assignment.enrollmentNo} not found`);
        continue;
      }
      
      await prisma.student.update({
        where: { id: student.id },
        data: {
          admissionYear: assignment.admissionYear,
          batchYear: assignment.batchYear
        }
      });
      
      updatedCount++;
      console.log(`Updated ${student.name} (${assignment.enrollmentNo}) -> ${assignment.batchYear}`);
    }
    
    console.log(`Successfully updated ${updatedCount} students`);
    
  } catch (error) {
    console.error('Error during manual batch assignment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run automatic assignment if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] || 'auto';
  
  if (mode === 'auto') {
    assignBatchesToStudents();
  } else if (mode === 'manual') {
    // Example manual assignments - modify as needed
    const manualAssignments = [
      // { enrollmentNo: "2023001", admissionYear: 2023, batchYear: "2023-2027" },
      // { enrollmentNo: "2022001", admissionYear: 2022, batchYear: "2022-2026" },
    ];
    
    if (manualAssignments.length === 0) {
      console.log('No manual assignments specified. Please edit the script to add assignments.');
    } else {
      assignManualBatches(manualAssignments);
    }
  } else {
    console.log('Usage: node scripts/assignBatches.js [auto|manual]');
    console.log('  auto: Automatically assign batches based on enrollment number patterns');
    console.log('  manual: Apply manual batch assignments (edit script first)');
  }
}

export { assignBatchesToStudents, assignManualBatches };