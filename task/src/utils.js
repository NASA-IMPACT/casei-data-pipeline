const fs = require('fs');

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

module.exports = {
  getStats,
  tsv2csv,
  concatenateFiles,
};
