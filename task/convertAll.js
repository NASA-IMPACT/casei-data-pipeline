const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

const {
  convertToGeoJSON,
  getPropertiesFromPath,
  mergeGeoJSONCollection,
} = require('./src/process');

const dir = process.argv[2];
const properties = getPropertiesFromPath(dir);

const files = fs.readdirSync(dir);
const collection = files
  .filter((f) => f.endsWith('.csv') && !f.endsWith('headers.csv'))
  .map((f) => path.join(dir, f))
  .map((f) => convertToGeoJSON(f, properties));

const resultFile = path.join(
  dir,
  slugify(`${properties.deployment}-${properties.platform_name}.geojson`)
);

mergeGeoJSONCollection(collection, resultFile);
