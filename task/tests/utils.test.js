import fs from 'fs';
import {
  tsv2csv,
  getStats,
  getPlatformConfig,
  divideCoordinates,
  urlHasFileExtension,
} from '../src/utils';

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

describe('getPlatformConfig', () => {
  it('return correct info from yaml file', () => {
    const platformConfig = getPlatformConfig('../campaigns/OLYMPEX/OLYMPEX-D1_2015/ER-2');
    expect(platformConfig.name).toBe('ER-2');
    expect(platformConfig.files.length).toBe(30);
  });
});

describe('urlHasFileExtension', () => {
  it('return true if an URL ends with any 3 or 4 letters file extension', () => {
    expect(urlHasFileExtension(
      'https://nasa.gov/PolarWindsI_DAWN_KingAirUC-12B_1.20141113-140215_txt.zip'
    )).toBeTruthy();
    expect(urlHasFileExtension('https://a.com/b/c/d.ext')).toBeTruthy();
    expect(urlHasFileExtension('https://a.com/b/c/d.WB57')).toBeTruthy();
    expect(urlHasFileExtension('https://a.com/b/c/d.WB57')).toBeTruthy();
    expect(urlHasFileExtension('https://a.com/b/c/d.extasd')).toBeFalsy();
    expect(urlHasFileExtension('https://a.com/b/c/d32.ext1asd')).toBeFalsy();
    expect(urlHasFileExtension('https://a.com/b/c/d12.ext1-asd')).toBeFalsy();
    expect(urlHasFileExtension('https://a.com/b/c/d12.ER')).toBeFalsy();
  });
});

describe('divideCoordinates', () => {
  it('return coordinates divided by a number', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'test' },
          geometry: {
            coordinates: [
              120898437,
              156230368,
            ],
            type: 'Point',
          },
        },
        {
          type: 'Feature',
          properties: { name: 'test2' },
          geometry: {
            coordinates: [
              1200898437,
              1596230368,
            ],
            type: 'Point',
          },
        },
      ],
    };
    const fixedGeojson = divideCoordinates(geojson.features, 10000000);
    expect(fixedGeojson[0].geometry.coordinates).toEqual([12.0898437, 15.6230368]);
    expect(fixedGeojson[1].geometry.coordinates).toEqual([120.0898437, 159.6230368]);
    const fixedGeojson2 = divideCoordinates(geojson.features, 100000000);
    expect(fixedGeojson2[0].geometry.coordinates).toEqual([1.20898437, 1.56230368]);
    expect(fixedGeojson2[1].geometry.coordinates).toEqual([12.00898437, 15.96230368]);
  });
});
