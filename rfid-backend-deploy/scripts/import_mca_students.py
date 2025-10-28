import openpyxl
import os
import json

# Path to the MCA RFID Sheet
xlsx_path = r'c:\Users\ogita\OneDrive\Desktop\rfid_website_new\MCA RFID Sheet 2025.xlsx'

# Section A ID for MCA (from database query result)
SECTION_A_ID = '68d168361600e44cc2dae94d'  # MCA Section A

# Load workbook and sheet
wb = openpyxl.load_workbook(xlsx_path)
sheet = wb.active

students = []
for row in sheet.iter_rows(min_row=2, values_only=True):
    institute_code = row[0]  # Not used
    employee_code = row[1]   # Maps to enrollmentNo
    rfid = row[2]           # Maps to rfidUid
    employee_name = row[5]  # Maps to name
    
    if employee_name and rfid and employee_code:
        students.append({
            'name': str(employee_name).strip(),
            'rfidUid': str(rfid).strip(),
            'enrollmentNo': str(employee_code).strip(),
            'sectionId': SECTION_A_ID
        })

print(f"Parsed {len(students)} students for Section A.")

# Generate JavaScript file for Node.js with Prisma
js_template = """import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const students = STUDENTS_DATA;

async function importStudents() {
  try {
    console.log('Starting student import...');
    
    for (const student of students) {
      // Check if student already exists
      const existing = await prisma.student.findFirst({
        where: {
          OR: [
            { rfidUid: student.rfidUid },
            { enrollmentNo: student.enrollmentNo }
          ]
        }
      });
      
      if (existing) {
        console.log(`Student already exists: ${student.name} (${student.enrollmentNo})`);
        continue;
      }
      
      // Insert new student
      const created = await prisma.student.create({
        data: student
      });
      console.log(`Created student: ${created.name} (${created.enrollmentNo})`);
    }
    
    console.log('Student import completed successfully!');
  } catch (error) {
    console.error('Error importing students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importStudents();
"""

js_content = js_template.replace('STUDENTS_DATA', json.dumps(students, indent=2))

# Write the Node.js script
with open(os.path.join(os.path.dirname(__file__), 'import_mca_students.js'), 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Node.js import script generated: import_mca_students.js")
print("Run with: node scripts/import_mca_students.js")
