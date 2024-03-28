const path = require('path');
const fs = require('fs');

const { splitICTFile } = require('./src/process');
const { concatenateFiles, getPlatformConfig } = require('./src/utils');
const { findFiles } = require('./src/find');

const platformPath = process.argv[2];
const platformConfig = getPlatformConfig(platformPath);

const headersFile = path.join(platformPath, 'headers.csv');

// process .txt files
const txtFiles = findFiles(platformPath, '.txt');
if (fs.existsSync(headersFile)) {
  txtFiles.forEach((f) => concatenateFiles(headersFile, f, `${f}.csv`));
}

// process .ict files
const ictFiles = findFiles(platformPath, '.ict');
ictFiles.forEach((f) => splitICTFile(f, platformConfig.tsv_format));

// some platforms have txt files formatted as icartt
if (platformConfig.process_as_ict) {
  txtFiles.forEach((f) => splitICTFile(f, platformConfig.tsv_format));
}
