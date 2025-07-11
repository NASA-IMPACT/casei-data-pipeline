import fs from 'fs';
import path from 'path';
import * as dsv from 'd3-dsv';
import csv2geojson from 'csv2geojson';
import simplify from 'simplify-geojson';

import * as geojsonMerge from '@mapbox/geojson-merge';
import * as dist from '@turf/distance';
import splitGeoJSON from 'geojson-antimeridian-cut';
import geoPrecision from 'geojson-precision';

import { getStats, tsv2csv, divideCoordinates } from './utils.js';
import { formatHeaderRow } from './headers.js';

/**
 * Read a directory structure and return the properties metadata that needs to be added to a GeoJSON
 * file.
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
 * @param {Number} dataStartLineFix - sum or subtract a value to/from the dataStartLine
 * value in the ICT header
 */
const getDataContentFromICT = (filename, dataStartLineFix = 0, replaceHeaderContent = '') => {
  const file = fs.readFileSync(filename);
  let content = file.toString().split('\n');
  let dataStartLine = 0;
  let header;
  // some campaigns have a different header identifier
  if (content[0] === '/begin_header') {
    for (let i = 0; i < content.indexOf('/end_header'); i++) {
      if (content[i].startsWith('/fields=')) {
        header = content[i].replace('/fields=', '');
        break;
      }
    }
    dataStartLine = content.indexOf('/end_header');
    return [header, ...content.slice(dataStartLine + 1)].join('\n');
  }
  const ictDataStartLine = parseInt(content[0].match(/[^,\s]+/)[0], 10);
  // some .ict files have a wrong dataStartLine, in that case, we don't use that value
  if (ictDataStartLine <= content.length) dataStartLine = ictDataStartLine;

  if (replaceHeaderContent) {
    return [
      replaceHeaderContent,
      ...content.slice(dataStartLine + dataStartLineFix - 1),
    ].join('\n');
  }
  content = content.slice(dataStartLine - 1 + dataStartLineFix).join('\n');
  return content;
};

/**
 * Reads an ICT file and creates a CSV file, containing only the relevant data.
 * @param {String} filePath - XML file path
 * @param {Boolean} isTSVFormatted - whether the file is formatted as a TSV
 * @param {Number} dataStartLineFix - sum or subtract a value to/from the dataStartLine
 * value in the ICT header
 */
const splitICTFile = (
  filename,
  isTSVFormatted = false,
  dataStartLineFix = 0,
  replaceHeaderContent = ''
) => {
  let content = getDataContentFromICT(filename, dataStartLineFix, replaceHeaderContent);

  if (isTSVFormatted) {
    content = tsv2csv(content);
  }

  const header = formatHeaderRow(content.substr(0, content.indexOf('\n')));
  content = `${header}${content.substr(content.indexOf('\n'))}`;

  const newFileName = filename.endsWith('.ict')
    ? filename.replace('.ict', '.csv')
    : `${filename}.csv`;

  fs.writeFileSync(newFileName, content.toLowerCase());
};

/**
 * Reads a CSV file and returns an object with the properties that needs to be added to the
 * GeoJSON feature. The metadata can be composed of some predefined metadata, and stats calculated
 * from the CSV lines.
 * @summary Reads a CSV file and returns an object with the properties that needs to be added to the
 * GeoJSON feature.
 * @param {String} data - CSV content
 * @param {Object} extraProperties - predefined properties
 * @param {Array} columnsStats - an array containing the columns that will have the stats computed.
 * Stats include the average, minimum and maximum values.
 * @return {Object} properties object
 */
const getPropertiesFromCSV = (data, extraProperties = {}, columnsStats = []) => {
  const properties = { ...extraProperties };
  const csvContent = dsv.dsvFormat(',').parse(data, (r) => r);
  properties.product = csvContent[0]?.product;
  properties.start = csvContent[0]?.timestamp;
  properties.end = csvContent[csvContent.length - 1]?.timestamp;
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
 * kilometers from the previous valid coordinate.
 * @param {Array} coords - geojson feature coordinates array
 * @param {Number} maxDistance - maximum acceptable distance from the previous coordinate in
 * kilometers
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
 * Stats include the average, minimum and maximum values.
 * @param {Number} coordsDivisor - an optional integer number. Case informed,
 * all coordinates values will be divided by it.
 * @param {Boolean} fixCoords - if true, coordinates that seems to be wrong will be removed.
 * See cleanCoords function.
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

  let geojson;
  csv2geojson.csv2geojson(
    content,
    {
      latfield: 'latitude',
      lonfield: 'longitude',
      delimiter: ',',
      numericFields: 'latitude,longitude',
    },
    (err, data) => geojson = data
  );
  if (coordsDivisor) {
    geojson.features = divideCoordinates(geojson.features, coordsDivisor);
  }
  // remove invalid coordinates
  geojson.features = geojson.features
    .filter((i) => (
      i.geometry.coordinates[0] >= -180 && i.geometry.coordinates[1] >= -90
      && i.geometry.coordinates[0] <= 180 && i.geometry.coordinates[1] <= 90
    ))
    .filter((i) => (
      i.geometry.coordinates[0] !== 0 && i.geometry.coordinates[1] !== 0
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
 * with the geometries simplified and filtering out the invalid LineStrings.
 * @param {String} filePath - path to a comma delimited CSV file
 * @param {Object} extraProperties - predefined properties
 * @param {Array} columnsStats - an array containing the columns that will have the stats computed.
 * Stats include the average, minimum and maximum values.
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

export {
  getPropertiesFromCSV,
  makeGeoJSON,
  makeStaticLocationsGeoJSON,
  convertToGeoJSON,
  splitICTFile,
  getPropertiesFromPath,
  getDataContentFromICT,
  mergeGeoJSONCollection,
  cleanCoords,
};
