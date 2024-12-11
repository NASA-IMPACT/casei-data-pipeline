const { listLinks } = require('./src/list-links');

const url = process.argv[2];
const outputFile = process.argv[3];

// this is a utility command to list the files URLs in some NASA websites,
// like https://asp-archive.arc.nasa.gov/PODEX/N809NA/
// It will create a txt with the URLs of the files listed in the
// subpages of that webpage.
// It also filters out all the files that don't contain the string "IWG1."
// and the .xml files

// Usage:
// yarn list-files https://asp-archive.arc.nasa.gov/PODEX/N809NA/ podex.txt

listLinks(url, outputFile);
