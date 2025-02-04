const path = require('path');
const fs = require('fs');

const { splitICTFile } = require('./process');
const { concatenateFiles, getPlatformConfig } = require('./utils');
const { findFiles } = require('./find');
const { netcdf2csv } = require('./netcdf');

const makeCSV = (platformPath) => {
  const platformConfig = getPlatformConfig(platformPath);
  const headersFile = path.join(platformPath, 'headers.csv');

  // process .txt files
  const txtFiles = findFiles(platformPath, '.txt');
  if (fs.existsSync(headersFile)) {
    txtFiles.forEach((f) => concatenateFiles(headersFile, f, `${f}.csv`));
  }

  // process .ict files
  const ictFiles = findFiles(platformPath, '.ict');
  ictFiles.forEach(
    (f) => splitICTFile(
      f,
      platformConfig.tsv_format,
      platformConfig.data_start_line_fix,
      platformConfig.header_content
    )
  );

  // process .nc files (NetCDF-4)
  const ncFiles = findFiles(platformPath, '.nc');
  ncFiles.forEach(
    (f) => netcdf2csv(
      f,
      platformConfig.latitudeField,
      platformConfig.longitudeField,
      platformConfig.timeField
    )
  );

  // some platforms have txt files formatted as icartt
  if (platformConfig.process_as_ict) {
    txtFiles.forEach(
      (f) => splitICTFile(
        f,
        platformConfig.tsv_format,
        platformConfig.data_start_line_fix,
        platformConfig.header_content
      )
    );
  }
};

module.exports = {
  makeCSV,
};
