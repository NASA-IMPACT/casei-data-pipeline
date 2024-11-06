const toGeojson = require('@tmcw/togeojson');
const fs = require('fs');
const { DOMParser } = require('xmldom');
const unzipper = require('unzipper');
const simplify = require('simplify-geojson');

const kml2geojson = (filePath, properties) => {
  const file = fs.readFileSync(filePath);
  const kml = new DOMParser().parseFromString(file.toString());
  const geojson = toGeojson.kml(kml);
  const features = geojson.features
    .filter((f) => f.geometry.type === 'LineString')
    .map((f) => ({ ...f, properties }));
  return simplify({ ...geojson, features }, 0.001);
};

const kmz2kml = (filePath) => new Promise((resolve, reject) => {
  fs.createReadStream(filePath)
    .pipe(unzipper.Parse())
    .on('entry', (entry) => {
      if (entry.path.indexOf('.kml') === -1) {
        entry.autodrain();
        return;
      }
      let data = '';

      entry.on('error', reject);

      entry.on('data', (chunk) => {
        data += chunk;
      });

      entry.on('end', () => {
        resolve(data);
      });
    })
    .on('error', reject);
});

module.exports = {
  kml2geojson,
  kmz2kml,
};
