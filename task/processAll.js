const path = require('path');
const fs = require('fs');

const { findDirectories, findFiles } = require('./src/find');
const { exportHeaders } = require('./src/headers');
const { makeCSV } = require('./src/makeCSV');
const { makePlatformGeoJSON } = require('./src/processPlatform');
const { convert } = require('./src/convert');
const { mergeGeoJSONCollection } = require('./src/process');

const campaignPath = process.argv[2];
const platforms = findDirectories(campaignPath, 2);

platforms.forEach((p) => {
  exportHeaders(p);
  makeCSV(p);
  makePlatformGeoJSON(p);
});

// convert the static CSV file to GeoJSON
const staticFile = path.join(campaignPath, 'static.csv');
if (fs.existsSync(staticFile)) {
  convert(staticFile);
}

// move platforms GeoJSON files to the campaign folder
platforms.forEach((p) => {
  findFiles(p, '.geojson').forEach(
    (f) => fs.renameSync(f, path.join(campaignPath, path.basename(f)))
  );
});

const campaignGeojson = path.join(
  campaignPath,
  `${path.basename(campaignPath)}.geojson`
);
// Delete previous campaignGeojson, if there is any
if (fs.existsSync(campaignGeojson)) {
  fs.unlinkSync(campaignGeojson);
}

const files = fs.readdirSync(campaignPath).filter((i) => i.endsWith('.geojson'));
const collection = files.map(
  (i) => JSON.parse(fs.readFileSync(path.join(campaignPath, i)).toString())
);

mergeGeoJSONCollection(collection, campaignGeojson);
