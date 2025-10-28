// Check what sheets exist in the Excel file
import ExcelJS from 'exceljs';
import path from 'path';

async function checkSheets() {
  const excelPath = path.resolve('C:\\Users\\ogita\\OneDrive\\Desktop\\rfid_website_new\\BBA LLB I Sem 2025.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);
  
  console.log('📊 Excel file sheets:');
  workbook.eachSheet((worksheet, sheetId) => {
    console.log(`   Sheet ${sheetId}: "${worksheet.name}" (${worksheet.rowCount} rows)`);
  });
  
  // Check first sheet structure
  if (workbook.worksheets.length > 0) {
    const firstSheet = workbook.worksheets[0];
    console.log(`\n📋 First sheet "${firstSheet.name}" header row:`);
    const headerRow = firstSheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      console.log(`   Column ${colNumber}: "${cell.value}"`);
    });
  }
}

checkSheets().catch(console.error);
