// scripts/add-avinash-teacher.js
// Run: npx dotenv -e .env -- node scripts/add-avinash-teacher.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import path from 'path';

const prisma = new PrismaClient();
const SALT = 10;

async function main() {
  console.log('🚀 Starting Avinash teacher setup...\n');

  /* ───────────────── 1. UPSERT USER + FACULTY ───────────────── */
  console.log('📝 Step 1: Creating user and faculty profile for Avinash sir...');
  
  const user = await prisma.user.upsert({
    where: { email: 'Avinash@vips.edu' },
    update: {},
    create: {
      email: 'Avinash@vips.edu',
      passwordHash: await bcrypt.hash('Avinash@123', SALT),
      role: 'TEACHER'
    }
  });
  console.log(`✅ User created: ${user.email}`);

  const faculty = await prisma.faculty.upsert({
    where: { empId: 'T_AVINASH' },
    update: { 
      userId: user.id,
      name: 'Avinash'
    },
    create: {
      userId: user.id,
      empId: 'T_AVINASH',
      name: 'Avinash',
      phone: '9999999999', // Update with actual phone if available
      rfidUid: (Math.random().toString(16).slice(2) + '000000000000').slice(0, 12)
    }
  });
  console.log(`✅ Faculty profile created: ${faculty.name} (EmpId: ${faculty.empId})\n`);

  /* ───────────────── 2. CREATE/FIND SUBJECT ───────────────── */
  console.log('📚 Step 2: Creating/finding subject "Civil Law"...');
  
  const subject = await prisma.subject.upsert({
    where: { code: 'BLAW101' },
    update: {},
    create: {
      code: 'BLAW101',
      name: 'Civil Law',
      credits: 4 // Adjust if needed
    }
  });
  console.log(`✅ Subject: ${subject.name} (${subject.code})\n`);

  /* ───────────────── 3. FIND/CREATE DEPARTMENT & COURSE ───────────────── */
  console.log('🏛️ Step 3: Setting up BBA Law department and course...');
  
  const department = await prisma.department.upsert({
    where: { code: 'BBALAW' },
    update: {},
    create: {
      code: 'BBALAW',
      name: 'BBA Law'
    }
  });
  console.log(`✅ Department: ${department.name}`);

  // Find or create course
  let course = await prisma.course.findFirst({
    where: {
      departmentId: department.id,
      name: 'BBA LLB'
    }
  });
  
  if (!course) {
    course = await prisma.course.create({
      data: {
        departmentId: department.id,
        name: 'BBA LLB',
        durationYears: 5,
        degreeType: 'Integrated'
      }
    });
    console.log(`✅ Created course: ${course.name}`);
  } else {
    console.log(`✅ Found existing course: ${course.name}`);
  }
  console.log();

  /* ───────────────── 4. CREATE SEMESTER ───────────────── */
  console.log('📅 Step 4: Creating semester for 2025-2029 batch, 1st sem...');
  
  const semester = await prisma.semester.upsert({
    where: {
      courseId_number_academicYear: {
        courseId: course.id,
        number: 1,
        academicYear: 2025
      }
    },
    update: {},
    create: {
      courseId: course.id,
      number: 1,
      type: 'Odd',
      academicYear: 2025
    }
  });
  console.log(`✅ Semester: ${semester.number} (Academic Year: ${semester.academicYear})\n`);

  /* ───────────────── 5. READ EXCEL AND CREATE SECTIONS ───────────────── */
  console.log('📖 Step 5: Reading Excel file and creating sections...');
  
  const excelPath = path.resolve('C:\\Users\\ogita\\OneDrive\\Desktop\\rfid_website_new\\BBA LLB I Sem 2025.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);
  
  const sectionMapping = {
    'I-L': 'L',
    'I-M': 'M',
    'I-N': 'N'
  };
  const sectionsData = {};
  
  for (const [sheetName, sectionName] of Object.entries(sectionMapping)) {
    console.log(`\n📋 Processing Section ${sectionName} (Sheet: ${sheetName})...`);
    
    // Create or find section
    const existingSection = await prisma.section.findFirst({
      where: {
        name: sectionName,
        semesterId: semester.id
      }
    });
    
    let section;
    if (existingSection) {
      section = existingSection;
      console.log(`✅ Found existing section: ${section.name}`);
    } else {
      section = await prisma.section.create({
        data: {
          name: sectionName,
          semesterId: semester.id
        }
      });
      console.log(`✅ Created new section: ${section.name}`);
    }
    
    sectionsData[sectionName] = { section, students: [] };
    
    // Read sheet for this section
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      console.log(`⚠️ Warning: Sheet "${sheetName}" not found in Excel file. Skipping students.`);
      continue;
    }
    
    const rows = [];
    let headerRow = null;
    
    // Find header row and read data
    worksheet.eachRow((row, rowNumber) => {
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const value = cell.value;
        if (rowNumber === 1) {
          // First row is header
          if (!headerRow) headerRow = [];
          headerRow[colNumber] = value;
        } else {
          // Data rows
          if (headerRow && headerRow[colNumber]) {
            rowData[headerRow[colNumber]] = value;
          }
        }
      });
      if (rowNumber > 1 && Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    });
    
    console.log(`   Found ${rows.length} rows in sheet ${sectionName}`);
    
    // Import students
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const row of rows) {
      // Expected columns: Name, Enrollment No, RFID UID
      const studentName = row['Name'] || row['name'] || row['STUDENT NAME'] || row['Student Name'];
      const enrollmentNo = row['Enrollment No'] || row['enrollment no'] || row['ENROLLMENT NO'] || row['Enrollment Number'];
      const rfidUid = row['RFID UID'] || row['rfid uid'] || row['RFID'] || row['Card Number'];
      
      if (!studentName || !enrollmentNo || !rfidUid) {
        console.log(`   ⚠️ Skipping row with missing data: ${JSON.stringify(row)}`);
        skippedCount++;
        continue;
      }
      
      // Check if student already exists
      const existingStudent = await prisma.student.findFirst({
        where: {
          OR: [
            { enrollmentNo: String(enrollmentNo) },
            { rfidUid: String(rfidUid) }
          ]
        }
      });
      
      if (existingStudent) {
        // Update section if needed
        if (existingStudent.sectionId !== section.id) {
          await prisma.student.update({
            where: { id: existingStudent.id },
            data: { sectionId: section.id }
          });
          console.log(`   ↻ Updated section for: ${studentName}`);
        } else {
          console.log(`   ✓ Student already exists: ${studentName}`);
        }
        skippedCount++;
        continue;
      }
      
      // Create new student
      try {
        const newStudent = await prisma.student.create({
          data: {
            name: String(studentName),
            enrollmentNo: String(enrollmentNo),
            rfidUid: String(rfidUid),
            sectionId: section.id,
            admissionYear: 2025,
            batchYear: '2025-2029'
          }
        });
        sectionsData[sectionName].students.push(newStudent);
        importedCount++;
        console.log(`   ✅ Created: ${studentName} (${enrollmentNo})`);
      } catch (error) {
        console.log(`   ❌ Error creating student ${studentName}: ${error.message}`);
        skippedCount++;
      }
    }
    
    console.log(`   Summary: ${importedCount} imported, ${skippedCount} skipped\n`);
  }

  /* ───────────────── 6. ADD SEMESTER-SUBJECT LINK ───────────────── */
  console.log('🔗 Step 6: Adding subject to semester...');
  
  const semesterSubject = await prisma.semesterSubject.upsert({
    where: {
      semesterId_subjectId: {
        semesterId: semester.id,
        subjectId: subject.id
      }
    },
    update: {},
    create: {
      semesterId: semester.id,
      subjectId: subject.id
    }
  });
  console.log(`✅ Subject linked to semester\n`);

  /* ───────────────── 7. CREATE SUBJECT INSTANCES ───────────────── */
  console.log('🎯 Step 7: Creating subject instances (linking teacher to sections)...');
  
  for (const sectionName of Object.values(sectionMapping)) {
    const { section } = sectionsData[sectionName];
    
    // Check if subject instance already exists
    const existingInstance = await prisma.subjectInstance.findFirst({
      where: {
        subjectId: subject.id,
        sectionId: section.id,
        facultyId: faculty.id
      }
    });
    
    if (existingInstance) {
      console.log(`✓ Subject instance already exists for section ${sectionName}`);
      continue;
    }
    
    // Create subject instance
    const instance = await prisma.subjectInstance.create({
      data: {
        subjectId: subject.id,
        sectionId: section.id,
        facultyId: faculty.id
      }
    });
    console.log(`✅ Created subject instance for section ${sectionName}`);
  }

  /* ───────────────── 8. SUMMARY ───────────────── */
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SUCCESS! Avinash teacher setup completed!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Teacher: ${faculty.name} (${user.email})`);
  console.log(`   Password: Avinash@123`);
  console.log(`   Subject: ${subject.name} (${subject.code})`);
  console.log(`   Program: ${course.name} - Semester ${semester.number}`);
  console.log(`   Sections: L, M, N`);
  
  for (const sectionName of Object.values(sectionMapping)) {
    const studentCount = await prisma.student.count({
      where: { sectionId: sectionsData[sectionName].section.id }
    });
    console.log(`   - Section ${sectionName}: ${studentCount} students`);
  }
  
  console.log('\n✨ Teacher can now login and teach Civil Law to sections L, M, and N!');
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error occurred:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
