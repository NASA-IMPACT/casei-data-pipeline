const fs = require('fs');
const path = require('path');
const { parse } = require('yaml');
const download = require('download');

const getDeployments = (file) => {
  const f = fs.readFileSync(file);
  return parse(f.toString()).deployments;
};

const replaceSlash = (str) => str.replaceAll('/', '-');

const downloadFile = async (url, dir) => {
  await download(
    url,
    dir,
    { headers: { Authorization: `Bearer ${process.env.EARTH_DATA_TOKEN}` } }
  );
};

const readCampaignYaml = (campaignPath) => {
  const campaignFilePath = path.join(campaignPath, 'deployments.yaml');
  return getDeployments(campaignFilePath);
};

const downloadCampaign = (campaignPath) => {
  const deployments = readCampaignYaml(campaignPath);

  Promise.all(deployments.map(
    async (deployment) => {
      await deployment.platforms.map(async (platform) => {
        await downloadPlatform(
          campaignPath,
          replaceSlash(deployment.name),
          replaceSlash(platform.name),
          platform.files
        );
      });
    }
  ));
};

const downloadPlatform = async (campaignPath, deployment, platform, files) => {
  const platformPath = path.join(campaignPath, deployment, platform);
  await createDir(platformPath);
  await Promise.all(files.map((file) => downloadFile(file, platformPath)));
  // some .ict files have a .ER2 extension, so we need to rename it after the download
  if (files.some((f) => f.endsWith('.ER2'))) {
    fs.readdirSync(platformPath)
      .filter((i) => i.endsWith('.ER2'))
      .forEach((i) => fs.renameSync(
        path.join(platformPath, i),
        path.join(platformPath, i.replace('.ER2', '.ict'))
      ));
  }
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
  readCampaignYaml,
};
