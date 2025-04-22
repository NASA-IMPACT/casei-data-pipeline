import { kml } from '@tmcw/togeojson';
import fs from 'fs';
import { DOMParser } from 'xmldom';
import unzipper from 'unzipper';
import { lineString } from '@turf/helpers';
import simplify from 'simplify-geojson';

const kml2geojson = (filePath, properties) => {
  const file = fs.readFileSync(filePath);
  const kmlContent = new DOMParser().parseFromString(file.toString());
  const geojson = kml(kmlContent);
  let features;
  // some kml files have all features as points, in that case,
  // we need to convert it to a single LineString
  if (geojson.features.every((f) => f.geometry.type === 'Point')) {
    features = [lineString(geojson.features.map((f) => f.geometry.coordinates), properties)];
  } else {
    features = geojson.features
      .filter((f) => f.geometry.type === 'LineString')
      .map((f) => ({ ...f, properties }));
  }
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

const extractKmlContent = (filePath) => new Promise((resolve, reject) => {
  fs.createReadStream(filePath)
    .pipe(unzipper.ParseOne(/\.kmz$/))
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

export {
  kml2geojson,
  extractKmlContent,
  kmz2kml,
};
