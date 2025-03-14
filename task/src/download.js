const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const download = require('download');
const {
  getPlatformConfig,
  readCampaignYaml,
  urlHasFileExtension,
  extractFromTar,
} = require('./utils');
const { kmz2kml, extractKmlContent } = require('./convert-kml');

const replaceSlash = (str) => str.replaceAll('/', '-');

const downloadFile = async (url, dir, platformConfig) => {
  // some download URLs don't have a file extension, the set_file_extension option
  // allows to download those files and set a specific file extension
  if (platformConfig.set_file_extension) {
    const randomId = globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
    fs.writeFileSync(
      path.join(
        dir,
        `${randomId}.${platformConfig.set_file_extension}`
      ),
      await download(url)
    );
    return;
  }
  try {
    await download(
      url,
      dir,
      { headers: { Authorization: `Bearer ${process.env.EARTH_DATA_TOKEN}` } }
    );
  } catch (HTTPError) {
    // some urls redirect to S3 and don't accept the Authorization header
    await download(url, dir, { followRedirect: true });
  }
  // if the file is a zip, decompress it
  if (url.endsWith('.zip')) {
    const filePath = path.join(dir, path.basename(url));
    // some zip files, have only a kmz file that needs to be extracted as kml
    if (platformConfig.filter_kmz) {
      const kml = await extractKmlContent(filePath);
      fs.writeFileSync(filePath.replace('.zip', '.kml'), kml);
    } else {
      const zip = await unzipper.Open.file(filePath);
      await zip.extract({ path: dir });
    }
    fs.unlinkSync(filePath);
  }
  // extract .tar files
  if (url.endsWith('.tar') || url.endsWith('.tgz') || url.endsWith('.tgz.sb')) {
    const filePath = path.join(dir, path.basename(url));
    await extractFromTar(filePath, dir);
    fs.unlinkSync(filePath);
  }
  // The GRIP campaign has files without an extension and others with .dat that should be txt
  if (!urlHasFileExtension(url) || url.endsWith('.dat')) {
    const filePath = path.join(dir, path.basename(url));
    fs.renameSync(filePath, `${filePath}.txt`);
  }
  if (url.endsWith('.kmz')) {
    const filePath = path.join(dir, path.basename(url));
    const kml = await kmz2kml(filePath);
    fs.writeFileSync(filePath.replace('.kmz', '.kml'), kml);
    fs.unlinkSync(filePath);
  }
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
  await Promise.all(
    files.map((file) => downloadFile(file, platformPath, platformConfig))
  );
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
  renameAsIct,
};
