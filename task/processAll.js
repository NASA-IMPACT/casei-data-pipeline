const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const { findDirectories, findFiles } = require('./src/find');

const campaignPath = process.argv[2];
const platforms = findDirectories(campaignPath, 2);

const opt = { encoding: 'utf-8' };

platforms.forEach((p) => execSync(`yarn process ${p}`, opt));

// convert the static CSV file to GeoJSON
const staticFile = path.join(campaignPath, 'static.csv');
if (fs.existsSync(staticFile)) {
  execSync(`yarn convert ${staticFile}`, opt);
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

execSync(`yarn merge ${campaignPath} ${path.basename(campaignGeojson)}`, opt);
