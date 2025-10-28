import ExcelJS from 'exceljs';

async function readExcel() {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('../attendance_session_report_68d25d7524e8bafaf12e6b04.xlsx');
    
    const worksheet = workbook.getWorksheet(1);
    
    // Get headers first
    const headers = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.value);
    });
    
    console.log('Headers:', headers);
    
    // Get data rows
    const data = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value;
        });
        data.push(rowData);
      }
    });
    
    console.log('\nData:', data);
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
}

readExcel();