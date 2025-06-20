import XLSX from 'xlsx';
import fs from 'fs';

const xlsx2csv = (filePath, headerContent) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  let content = XLSX.utils.sheet_to_csv(sheet);
  if (headerContent) {
    content = `${headerContent}\n${content}`;
  }

  fs.writeFileSync(`${filePath}.csv`, content);
};

export { xlsx2csv };
