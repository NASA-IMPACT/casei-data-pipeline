import { cleanCoords } from '../src/process';
import geojson from './geo-1.json';
import geojsonGood from './geo-2.json';

describe('cleanCoords', () => {
  it('drops coords with distance from previous coordinates greater than maxDistance', () => {
    expect(
      cleanCoords(geojson.features[0].geometry.coordinates, 300)
    ).toEqual(
      geojson.features[1].geometry.coordinates
    );
  });
  it('does not drop coords if distance is smaller than maxDistance', () => {
    expect(
      cleanCoords(geojsonGood.features[0].geometry.coordinates, 300)
    ).toEqual(
      geojsonGood.features[0].geometry.coordinates
    );
  });
  it('does not drop coords if distance is smaller than maxDistance', () => {
    expect(
      cleanCoords([[0, 0], [0.002, 0.002], [0.005, 0.005], [1.1, 1.1]], 30)
    ).toEqual(
      [[0, 0], [0.002, 0.002], [0.005, 0.005]]
    );
  });
});
