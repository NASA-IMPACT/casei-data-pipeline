import { formatHeaderRow } from '../src/headers';

describe('formatHeaderRow', () => {
  it('formats it with the correct latitude and longitude columns names', () => {
    expect(
      formatHeaderRow('UT, Lat, Lon, alt, alat, lateral, LOTE')
    ).toBe('ut,latitude,longitude,alt,alat,lateral,lote');
    expect(
      formatHeaderRow('Time, LAT, LON, alt, Alat, Lateral, LOTE')
    ).toBe('time,latitude,longitude,alt,alat,lateral,lote');
    expect(
      formatHeaderRow('Time_Start, GLAT, GLON, alt, Alat, Lateral, LOTE')
    ).toBe('time_start,latitude,longitude,alt,alat,lateral,lote');
    expect(
      formatHeaderRow('Time_Start, G_LAT, G_LONG, alt, Alat, Lateral, LOTE')
    ).toBe('time_start,latitude,longitude,alt,alat,lateral,lote');
  });
});
