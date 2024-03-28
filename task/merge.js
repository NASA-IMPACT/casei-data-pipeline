const fs = require('fs');
const path = require('path');
const { mergeGeoJSONCollection } = require('./src/process');

const dir = process.argv[2];
const filename = process.argv[3];

const files = fs.readdirSync(dir).filter((i) => i.endsWith('.geojson'));
const collection = files.map(
  (i) => JSON.parse(fs.readFileSync(path.join(dir, i)).toString())
);

mergeGeoJSONCollection(collection, path.join(dir, filename));
