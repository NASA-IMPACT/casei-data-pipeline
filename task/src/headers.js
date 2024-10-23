const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const LONGITUDE_COL_NAMES = [
  'lon',
  'long',
  'fms_lon',
  'g_long',
  'g_long_mms',
  'glon',
  'gglon',
  'gps_lon',
  'gps_lon_np',
  'gpslon',
  'longitude_deg',
  'pos_lon',
  'ship_log_interp_lon',
  'longitude_er2',
];

const LATITUDE_COL_NAMES = [
  'lat',
  'fms_lat',
  'g_lat',
  'g_lat_mms',
  'gglat',
  'glat',
  'gps_lat',
  'gps_lat_np',
  'gpslat',
  'latitude_deg',
  'pos_lat',
  'ship_log_interp_lat',
  'latitude_er2',
];

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
  if (filePath) {
    const headers = getHeaders(path.join(dir, filePath));
    const headersFile = path.join(dir, 'headers.csv');
    fs.writeFileSync(headersFile, headers.join(','));
    console.log(`headers file ${headersFile} created successfully.`);
  }
};

/**
* Some files have different column names for latitude and longitude,
* this function replaces the possible names for latitude and longitude
* @param {String} headerContent - Header row content
*/
const formatHeaderRow = (headerContent) => {
  let header = headerContent.toLowerCase().replaceAll(' ', '');
  LONGITUDE_COL_NAMES
    .filter((name) => header.lastIndexOf(name) > 0)
    .forEach((name) => header = header.replace(`,${name},`, ',longitude,'));
  LATITUDE_COL_NAMES
    .filter((name) => header.lastIndexOf(name) > 0)
    .forEach((name) => header = header.replace(`,${name},`, ',latitude,'));
  // some TSV formatted files have empty header columns after converting it to CSV
  header.replaceAll(',,', ',');
  return header;
};

module.exports = {
  exportHeaders,
  formatHeaderRow,
};
