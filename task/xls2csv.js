const XLSX = require('xlsx');
const fs = require('fs');

// Load the xlsx file
const workbook = XLSX.readFile(process.argv[2]);

// Loop through each sheet in the workbook
workbook.SheetNames.forEach((sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(sheet);

  // Check if the folder already exists, and write the csv file
  fs.access(`../campaigns/${sheetName}`, fs.constants.F_OK, (err) => {
    if (err) {
      fs.mkdirSync(`../campaigns/${sheetName}`);
    }
    fs.writeFileSync(
      `../campaigns/${sheetName}/static.csv`,
      csv.replaceAll(',,,,\n', '').replace(',,,,', '').replaceAll(' ,', ',')
    );
  });
});

console.log('CSV files exported successfully!');
