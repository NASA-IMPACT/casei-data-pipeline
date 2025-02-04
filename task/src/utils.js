const fs = require('fs');
const path = require('path');
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

const tsv2csv = (tsvContent) => tsvContent.replace(/( |\t)+/g, ',').replace(/^,+/gm, '');

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
    // As we remove the slashes from the platform folder,
    // we need to put it back when reading the yaml file
    .find((p) => p.name === platform || p.name === platform.replaceAll('-', '/'));
};

const divideCoordinates = (features, coordsDivisor) => features.map((i) => {
  const newGeometry = {
    ...i.geometry,
    coordinates: i.geometry.coordinates.map((c) => c / coordsDivisor),
  };
  return { ...i, geometry: newGeometry };
});

const urlHasFileExtension = (url) => {
  const ext = path.basename(url).split('.').slice(-1)[0];
  // .nc is the only extension that doesn't have a length of 3 or 4 chars
  if (ext === 'nc') return ext;
  return ext && [3, 4].includes(ext.length);
};

module.exports = {
  getStats,
  tsv2csv,
  concatenateFiles,
  getPlatformConfig,
  readCampaignYaml,
  divideCoordinates,
  urlHasFileExtension,
};
