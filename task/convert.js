const fs = require('fs');
const path = require('path');

const {
  convertToGeoJSON,
  makeStaticLocationsGeoJSON,
  getPropertiesFromPath,
} = require('./src/process');

let geojson;
const filename = process.argv[2];

if (filename.endsWith('static.csv')) {
  geojson = makeStaticLocationsGeoJSON(filename);
} else {
  const properties = getPropertiesFromPath(path.basename(filename));
  geojson = convertToGeoJSON(filename, properties);
}

const geoJsonFilename = filename.endsWith('.csv')
  ? filename.replace('.csv', '.geojson')
  : filename.replace('.ict', '.geojson');
fs.writeFileSync(
  geoJsonFilename,
  JSON.stringify(geojson)
);

console.log(`Converted ${filename} to ${geoJsonFilename}.`);
