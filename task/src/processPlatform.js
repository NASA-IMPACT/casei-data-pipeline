const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

const {
  convertToGeoJSON,
  getPropertiesFromPath,
  mergeGeoJSONCollection,
} = require('./process');
const { getPlatformConfig } = require('./utils');
const { kml2geojson } = require('./convert-kml');

const makePlatformGeoJSON = (dir) => {
  const properties = getPropertiesFromPath(dir);
  const platformConfig = getPlatformConfig(dir);

  const files = fs.readdirSync(dir);
  let collection;
  // convert CSV files to GeoJSON
  collection = files
    .filter((f) => f.endsWith('.csv') && !f.endsWith('headers.csv'))
    .map((f) => path.join(dir, f))
    .map((f) => convertToGeoJSON(f, properties, platformConfig.coords_divisor));

  // if the platform has
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

module.exports = {
  makePlatformGeoJSON,
};
