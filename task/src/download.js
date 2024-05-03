const fs = require('fs');
const path = require('path');

const download = require('download');
const { getPlatformConfig, readCampaignYaml } = require('./utils');

const replaceSlash = (str) => str.replaceAll('/', '-');

const downloadFile = async (url, dir) => {
  await download(
    url,
    dir,
    { headers: { Authorization: `Bearer ${process.env.EARTH_DATA_TOKEN}` } }
  );
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

const renameAsIct = (platformPath) => {
  fs.readdirSync(platformPath)
    .forEach((i) => fs.renameSync(
      path.join(platformPath, i),
      path.join(platformPath, i.replace(/\.[^.]+$/, '.ict'))
    ));
};

const downloadPlatform = async (campaignPath, deployment, platform, files) => {
  const platformPath = path.join(campaignPath, deployment, platform);
  const platformConfig = getPlatformConfig(platformPath);
  await createDir(platformPath);
  await Promise.all(files.map((file) => downloadFile(file, platformPath)));
  // some .ict files have a .ER2 or .WB57 extension,
  // so we need to rename it after the download
  if (platformConfig.rename_as_ict) {
    renameAsIct(platformPath);
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
};
