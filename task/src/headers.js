const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

/**
* Read a XML file and get the headers information.
* @param {String} filename - path to the XML file
* @return {Array} headers array
*/
const getHeaders = (filename) => {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '$' });
  const file = fs.readFileSync(filename);
  const data = parser.parse(file.toString());
  const headers = data.config.parameter
    .map((i) => (i.$id ? 'timestamp' : i['$xml:id']))
    .map((i) => i.toLowerCase());
  return ['product', ...headers];
};

/**
* Inspect a platform data directory and find the header file.
* @param {String} dir - Directory containing the platform data
* @return {String} header filename
*/
const findHeaderFile = (dir) => {
  const files = fs.readdirSync(dir);
  return files.filter((f) => f.endsWith('.xml'))[0];
};

/**
* Reads a XML file and export the headers to a new CSV file.
* @param {String} dir - Directory containing the platform data
*/
const exportHeaders = (dir) => {
  const filePath = findHeaderFile(dir);
  const headers = getHeaders(path.join(dir, filePath));
  const headersFile = path.join(dir, 'headers.csv');
  fs.writeFileSync(headersFile, headers.join(','));
  console.log(`headers file ${headersFile} created successfully.`);
};

module.exports = {
  exportHeaders,
};
