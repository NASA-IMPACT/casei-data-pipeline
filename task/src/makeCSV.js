const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const { splitICTFile } = require('./process');
const { concatenateFiles, getPlatformConfig } = require('./utils');
const { findFiles } = require('./find');
const { netcdf2csv } = require('./netcdf');
const { hdf52csv } = require('./hdf5');

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
      platformConfig?.latitude_field,
      platformConfig?.longitude_field,
      platformConfig?.time_field
    )
  );

  if (platformConfig.use_python_hdf) {
    console.log('HDF files are already converted to CSV.');
  }

  // process .h5 files (HDF5)
  const h5Files = findFiles(platformPath, '.h5');
  h5Files.forEach(
    (f) => hdf52csv(
      f,
      platformConfig.latitude_field,
      platformConfig.longitude_field,
      platformConfig.time_field
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
