import { findFiles } from '../src/find';

describe('findFiles', () => {
  it('return all files filtered by extension', () => {
    expect(
      findFiles('./tests', '.json')
      ).toEqual(['tests/geo-1.json', 'tests/geo-2.json']);
  });
});
