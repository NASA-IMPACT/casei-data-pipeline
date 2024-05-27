const fs = require('fs');
const path = require('path');
const tar = require('tar');
const { parse } = require('yaml');

const getMax = (arr) => {
  let len = arr.length;
  let max = -Infinity;

  while (len--) {
    max = arr[len] > max ? arr[len] : max;
  }
  return max;
};

const getMin = (arr) => {
  let len = arr.length;
  let min = Infinity;

  while (len--) {
    min = arr[len] < min ? arr[len] : min;
  }
  return min;
};

const getStats = (arr) => ({
  max: getMax(arr),
  min: getMin(arr),
  avg: arr.reduce((a, b) => a + b, 0) / arr.length,
});

const tsv2csv = (tsvContent) => tsvContent
  // replace "G 123:" with "123:". 123 can be any number between 1 and 3 digits
  .replace(/G\s(\d{1,3}):/g, '$1:')
  // replace " N 1" or " E 1" with " 1"
  .replaceAll(/\s([NE])\s?(\d{1,3})./g, ' $2.')
  // replace " W 1" or " S 1" with " -1"
  .replaceAll(/\s([WS])\s?(\d{1,3})./g, ' -$2.')
  // replace whitespaces with commas
  .replace(/( |\t)+/g, ',')
  .replace(/^,+/gm, '');

const concatenateFiles = (file1, file2, output) => {
  const data1 = fs.readFileSync(file1);
  const data2 = fs.readFileSync(file2);

  fs.writeFileSync(output, data1 + data2);
};

const getDeployments = (file) => {
  const f = fs.readFileSync(file);
  return parse(f.toString()).deployments;
};

const readCampaignYaml = (campaignPath) => {
  const campaignFilePath = path.join(campaignPath, 'deployments.yaml');
  return getDeployments(campaignFilePath);
};

const getPlatformConfig = (platformPath) => {
  const campaignConfig = readCampaignYaml(path.resolve(platformPath, '../..'));
  const deployment = path.basename(path.resolve(platformPath, '../'));
  const platform = path.basename(platformPath);
  return campaignConfig
    .find((d) => d.name === deployment).platforms
    .find((p) => p.name === platform);
};

const divideCoordinates = (features, coordsDivisor) => features.map((i) => {
  const newGeometry = {
    ...i.geometry,
    coordinates: i.geometry.coordinates.map((c) => c / coordsDivisor),
  };
  return { ...i, geometry: newGeometry };
});

const extractFromTar = async (tarFilePath, destination, extension) => {
  await tar.list({
    file: tarFilePath,
    onentry: (entry) => {
      if (entry.path.endsWith(extension)) {
        entry.pipe(fs.createWriteStream(`${destination}/${entry.path}`));
      } else {
        entry.resume(); // Skip non-.txt files
      }
    },
  }, (err) => {
    if (err) {
      console.error('Error extracting tar file:', err);
    } else {
      console.log('Tar file extracted successfully!');
    }
  });
};

module.exports = {
  getStats,
  tsv2csv,
  concatenateFiles,
  getPlatformConfig,
  readCampaignYaml,
  divideCoordinates,
  extractFromTar,
};
