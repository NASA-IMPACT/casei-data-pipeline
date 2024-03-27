const fs = require('fs');
const { tsv2csv, getStats } = require('../src/utils');

describe('tsv2csv', () => {
  it('converts the tsv file format to csv', () => {
    const content = fs.readFileSync('./tests/file.tsv').toString();
    const csv = tsv2csv(content);
    expect(csv.startsWith('Time,POS_Lat,POS_Lon,POS_Alt')).toBeTruthy();
    expect(csv.endsWith('33034.8900,36.7350,-97.1016,330.0864')).toBeTruthy();
  });
});

describe('getStats', () => {
  it('computes min, max and average values correctly', () => {
    expect(getStats([1, 10, 34])).toEqual({ min: 1, max: 34, avg: 15 });
    expect(getStats([1, 10, 9])).toEqual({ min: 1, max: 10, avg: 6.666666666666667 });
  });
});
