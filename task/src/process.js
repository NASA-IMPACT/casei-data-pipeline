const fs = require('fs');
const path = require('path');
const dsv = require('d3-dsv');
const csv2geojson = require('csv2geojson');
const simplify = require('simplify-geojson');

const geojsonMerge = require('@mapbox/geojson-merge');
const dist = require('@turf/distance');
const splitGeoJSON = require('geojson-antimeridian-cut');
const geoPrecision = require("geojson-precision");

const { getStats, tsv2csv, divideCoordinates } = require('./utils');

/**
* Read a directory structure and return the properties metadata that needs to be added to a GeoJSON
file.
* @param {String} dir - Directory path
* @return {Object} platform_name, deployment and campaign information
*/
const getPropertiesFromPath = (dir) => {
  const platformName = path.basename(dir);
  const deployment = path.basename(path.dirname(dir));
  const campaign = path.basename(path.dirname(path.dirname(dir)));
  return { platform_name: platformName, deployment, campaign };
};

/**
* Reads an ICT file and returns only the data rows.
* @param {String} filename - XML file path
* @param {Number} dataStartLineFix - sum or substract a value to/from the dataStartLine
* value in the ict header
*/
const getDataContentFromICT = (filename, dataStartLineFix = 0) => {
  const file = fs.readFileSync(filename);
  let content = file.toString().split('\n');
  const dataStartLine = Number(content[0].split(/\s*,?\s*1001/g)[0]);
  content = content.slice(dataStartLine - 1 + dataStartLineFix).join('\n');
  return content;
};

/**
* Reads an ICT file and creates a CSV file, containing only the relevant data.
* @param {String} filePath - XML file path
* @param {Boolean} isTSVFormatted - whether the file is formatted as a TSV
* @param {Number} dataStartLineFix - sum or substract a value to/from the dataStartLine
* value in the ict header
*/
const splitICTFile = (filename, isTSVFormatted = false, dataStartLineFix = 0) => {
  let content = getDataContentFromICT(filename, dataStartLineFix);

  if (isTSVFormatted) {
    content = tsv2csv(content);
  }

  // some files have different column names for latitude and longitude
  content = content
    .replace(',Lat,', ',latitude,')
    .replace(',Long,', ',longitude,')
    .replace(',Lon,', ',longitude,')
    .replace(', LAT,', ',latitude,')
    .replace(', LONG,', ',longitude,')
    .replace(',LONG,', ',longitude,')
    .replace(',LAT,', ',latitude,')
    .replace(',LON,', ',longitude,')
    .replace(',FMS_LAT,', ',latitude,')
    .replace(',FMS_LON,', ',longitude,')
    .replace(',GGLAT,', ',latitude,')
    .replace(',GGLON,', ',longitude,')
    .replace(',GLAT,', ',latitude,')
    .replace(',GLON,', ',longitude,')
    .replace(',gLat,', ',latitude,')
    .replace(',gLon,', ',longitude,')
    .replace(', GPSLat,', ',latitude,')
    .replace(', GPSLon,', ',longitude,')
    .replace(', Gps_lat,', ',latitude,')
    .replace(', Gps_lon,', ',longitude,')
    .replace(', G_LAT,', ',latitude,')
    .replace(', G_LONG,', ',longitude,')
    .replace(', G_LAT_MMS,', ',latitude,')
    .replace(', G_LONG_MMS,', ',longitude,')
    .replace(', GPS_LAT_NP,', ',latitude,')
    .replace(', GPS_LON_NP,', ',longitude,')
    .replace(', FMS_LAT,', ',latitude,')
    .replace(', FMS_LON,', ',longitude,')
    .replace(',POS_Lat,', ',latitude,')
    .replace(',POS_Lon,', ',longitude,')
    .replace(', Latitude,', ',latitude,')
    .replace(', Longitude,', ',longitude,')
    .replace(', ship_log_interp_lat,', ',latitude,')
    .replace(', ship_log_interp_lon,', ',longitude,');

  const header = content.substr(0, content.indexOf('\n')).replaceAll(',,', ',');
  content = `${header}${content.substr(content.indexOf('\n'))}`;

  const newFileName = filename.endsWith('.ict')
    ? filename.replace('.ict', '.csv')
    : `${filename}.csv`;

  fs.writeFileSync(newFileName, content.toLowerCase());
};

/**
* Reads a CSV file and returns an object with the properties that needs to be added to the
GeoJSON feature. The metadata can be composed of some predefined metadata, and stats calculated
from the CSV lines.
* @summary Reads a CSV file and returns an object with the properties that needs to be added to the
GeoJSON feature.
* @param {String} data - CSV content
* @param {Object} extraProperties - predefined properties
* @param {Array} columnsStats - an array containing the columns that will have the stats computed.
Stats include the average, minimum and maximum values.
* @return {Object} properties object
*/
const getPropertiesFromCSV = (data, extraProperties = {}, columnsStats = []) => {
  const properties = { ...extraProperties };
  const csvContent = dsv.dsvFormat(',').parse(data, (r) => r);
  properties.product = csvContent[0].product;
  properties.start = csvContent[0].timestamp;
  properties.end = csvContent[csvContent.length - 1].timestamp;
  columnsStats.forEach(
    (p) => {
      properties[p] = getStats(
        csvContent.filter((i) => Number(i[p]) !== NaN).map((i) => Number(i[p]))
      );
    }
  );
  return properties;
};

/**
* Iterates over an array of coordinates and remove the ones that are further away than X
kilometers from the previous valid coordinate.
* @param {Array} coords - geojson feature coordinates array
* @param {Number} maxDistance - maximum acceptable distance from the previous coordinate in
kilometers
* @return {Array} coordinates that pass the maximum distance check
*/
const cleanCoords = (coords, maxDistance) => {
  let lastValidCoord;
  return coords.filter(
    (c, i) => {
      if (i > 0) {
        // maxDistance unit is kilometers
        const isValid = dist.default(c, lastValidCoord) < maxDistance;
        if (isValid) lastValidCoord = c;
        return isValid;
      }
      lastValidCoord = c;
      return true;
    }
  );
};

/**
* Reads a CSV file containing a set of static locations and returns the data in GeoJSON format.
* @param {String} filePath - path to a comma delimited CSV file
* @return {Object} resulting GeoJSON object
*/
const makeStaticLocationsGeoJSON = (filePath) => {
  const file = fs.readFileSync(filePath);
  const content = file.toString();
  let geojson;
  csv2geojson.csv2geojson(
    content,
    { latfield: 'latitude', lonfield: 'longitude', delimiter: ',' },
    (err, data) => geojson = data
  );
  return geojson;
};

/**
* Reads a CSV file containing flight data and returns the data in GeoJSON format.
* @param {String} filePath - path to a comma delimited CSV file
* @param {Object} extraProperties - predefined properties
* @param {Array} columnsStats - an array containing the columns that will have the stats computed.
Stats include the average, minimum and maximum values.
* @param {Number} coordsDivisor - an optional integer number. Case informed,
all coordinates values will be divided by it.
* @param {Boolean} fixCoords - if true, coordinates that seems to be wrong will be removed.
See cleanCoords function.
* @return {Object} resulting GeoJSON object
*/
const makeGeoJSON = (
  filePath,
  extraProperties = {},
  columnsStats = [],
  coordsDivisor = null,
  fixCoords = true
) => {
  const file = fs.readFileSync(filePath);
  const content = file.toString();
  // configure latitude and longitude fields
  let latField = 'latitude';
  let lonField = 'longitude';
  if (content.includes('Latitude,') && content.includes('Longitude,')) {
    latField = 'Latitude';
    lonField = 'Longitude';
  }

  let geojson;
  csv2geojson.csv2geojson(
    content,
    { latfield: latField, lonfield: lonField, delimiter: ',' },
    (err, data) => geojson = data
  );
  if (coordsDivisor) {
    geojson.features = divideCoordinates(geojson.features, coordsDivisor);
  }
  // remove invalid coordinates
  geojson.features = geojson.features.filter((i) => (
    i.geometry.coordinates[0] >= -180 && i.geometry.coordinates[1] >= -90
    && i.geometry.coordinates[0] <= 180 && i.geometry.coordinates[1] <= 90
  ));
  geojson = csv2geojson.toLine(geojson);
  if (fixCoords) {
    const newCoords = cleanCoords(geojson.features[0].geometry.coordinates, 300);
    geojson.features[0].geometry.coordinates = newCoords;
  }
  geojson.features[0].properties = getPropertiesFromCSV(content, extraProperties, columnsStats);
  return geojson;
};

/**
* Reads a CSV file containing flight data and returns the data in GeoJSON format,
with the geometries simplified and filtering out the invalid LineStrings.
* @param {String} filePath - path to a comma delimited CSV file
* @param {Object} extraProperties - predefined properties
* @param {Array} columnsStats - an array containing the columns that will have the stats computed.
Stats include the average, minimum and maximum values.
* @return {Object} resulting GeoJSON object
*/
const convertToGeoJSON = (
  filePath,
  extraProperties = {},
  coordsDivisor = null,
  columnsStats = ['gps_altitude', 'pressure_altitude']
) => {
  const geojson = simplify(
    makeGeoJSON(filePath, extraProperties, columnsStats, coordsDivisor),
    0.001
  );
  // some files have the same pair coordinates repeated in all rows, what generates
  // an invalid LineString starting and ending in the same location, so we need to
  // exclude those items from the final GeoJSON
  geojson.features = geojson.features.filter((i) => i.geometry.coordinates.length > 2);
  // split features if it crosses the antimeridian
  return splitGeoJSON(geojson);
};

/**
* Merge in a single file a GeoJSON feature collection.
* @param {Array} collection - collection of GeoJSON features
* @param {String} outputFilename - name of the output file
*/
const mergeGeoJSONCollection = (collection, outputFilename) => {
  const mergedStream = geojsonMerge.merge(collection);
  const finalGeoJSON = geoPrecision.parse(mergedStream, 6);

  fs.writeFileSync(outputFilename, JSON.stringify(finalGeoJSON));
  console.log(`${outputFilename} created successfully.`);
};

module.exports = {
  getPropertiesFromCSV,
  makeGeoJSON,
  makeStaticLocationsGeoJSON,
  convertToGeoJSON,
  splitICTFile,
  getPropertiesFromPath,
  mergeGeoJSONCollection,
  cleanCoords,
};
