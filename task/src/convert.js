import fs from 'fs';
import path from 'path';

import {
  convertToGeoJSON,
  makeStaticLocationsGeoJSON,
  getPropertiesFromPath,
} from './process.js';

const convert = (filename) => {
  let geojson;

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
};

export { convert };
