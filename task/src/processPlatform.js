import fs from 'fs';
import path from 'path';
import slugify from 'slugify';

import {
  convertToGeoJSON,
  getPropertiesFromPath,
  mergeGeoJSONCollection,
} from './process.js';
import { getPlatformConfig } from './utils.js';
import { kml2geojson } from './convert-kml.js';

const makePlatformGeoJSON = (dir) => {
  const properties = getPropertiesFromPath(dir);
  const platformConfig = getPlatformConfig(dir);

  const files = fs.readdirSync(dir);
  let collection;
  // convert CSV files to GeoJSON
  collection = files
    .filter((f) => f.endsWith('.csv') && !f.endsWith('headers.csv'))
    .map((f) => path.join(dir, f))
    .map((f) => convertToGeoJSON(
      f,
      // as some platforms can have a slash in the name, we use its original name
      // from the yaml config file, instead of the one from the DIR name
      { ...properties, platform_name: platformConfig.name },
      platformConfig.coords_divisor
    ));

  // if the platform has only kml files, convert them to geojson
  if (!collection.length && files.every((f) => f.endsWith('.kml'))) {
    collection = files
      .map((f) => path.join(dir, f))
      .map((f) => kml2geojson(f, properties));
  }

  const resultFile = path.join(
    dir,
    slugify(`${properties.deployment}-${properties.platform_name}.geojson`)
  );

  mergeGeoJSONCollection(collection, resultFile);
};

export { makePlatformGeoJSON };
