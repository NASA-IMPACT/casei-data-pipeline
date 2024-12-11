const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

async function getLinks(url) {
  /**
   * Retrieves all the links from a given webpage.
   * @param {string} url - The URL of the webpage to be accessed.
   * @returns {string[]} - A list of all the links found on the webpage.
   */
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const links = $('a').map((_, link) => `${url}/${$(link).attr('href')}`).get();
  return links;
}

function saveToCSV(links, outputFileName) {
  /**
   * Saves a list of links to a CSV file.
   * @param {string[]} links - A list of links to be saved.
   * @param {string} outputFileName - The name of the output CSV file.
   */
  fs.writeFileSync(outputFileName, links.join('\n'));
}

async function listLinks(url, outputFileName) {
  const initialLinks = await getLinks(url);
  const allLinks = await Promise.all(initialLinks.map((i) => getLinks(i)));
  saveToCSV(
    allLinks
      .flat().filter((i) => i.includes('IWG1.') && !i.includes('.xml')),
    outputFileName
  );
}

module.exports = {
  listLinks,
};
