const fs = require('fs');
const path = require('path');
const { parse } = require('yaml');
const download = require('download');
const { create } = require('domain');

const getDeployments = (file) => {
  const f = fs.readFileSync(file);
  return parse(f.toString()).deployments;
};

const downloadFile = async (url, dir) => {
  await download(
    url,
    dir,
    { headers: {Authorization: `Bearer ${process.env.EARTH_DATA_TOKEN}`} }
  );
};

const downloadCampaign = (campaignPath) => {
  const campaignFilePath = path.join(campaignPath, 'deployments.yaml');
  const deployments = getDeployments(campaignFilePath);
  Promise.all(deployments.map(
    async (deployment) => {
      await deployment.platforms.map(async (platform) => {
        const platformPath = path.join(campaignPath, deployment.name, platform.name);
        await createDir(platformPath);
        await downloadPlatform(campaignPath, deployment.name, platform.name, platform.files);
      });
    }
  ));
};

const downloadPlatform = async (campaignPath, deployment, platform, files) => {
  const platformPath = path.join(campaignPath, deployment, platform);
  createDir(platformPath);
  await Promise.all(files.map((file) => downloadFile(file, platformPath)));
};

const createDir = async (dir) =>
  await fs.mkdir(
    dir,
    { recursive: true },
    (e) => e ? console.log(e.message) : console.log(`Created ${dir}`)
);

module.exports = {
  downloadCampaign,
  downloadPlatform,
  downloadFile,
  getDeployments,
};
