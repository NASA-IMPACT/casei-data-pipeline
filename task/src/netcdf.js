import fs from 'fs';
import * as hdf5 from 'jsfive';
import { NetCDFReader } from 'netcdfjs';

/**
* Converts a NetCDF file to CSV, extracting the time, latitude and longitude information.
* @param {String} filePath - path to a NetCDF file
* @param {String} latitudeField - name of the field in the NetCDF file that contains the
  latitude information
* @param {String} longitudeField - name of the field in the NetCDF file that contains the
  longitude information
* @param {String} timeField - name of the field in the NetCDF file that contains the
  time information
*/
const netcdf2csv = (filePath, latitudeField = 'latitude', longitudeField = 'longitude', timeField = 'time') => {
  const file = fs.readFileSync(filePath);
  let csvContent = 'time,latitude,longitude\n';
  let latitudes;
  let longitudes;
  let times;

  try {
    // Deal with NetCDF-4 files
    const data = new hdf5.File(file.buffer);
    latitudes = data.get(latitudeField).value;
    longitudes = data.get(longitudeField).value;
    times = data.get(timeField).value;
  } catch (e) {
    // Fallback to NetCDF-3 files
    const reader = new NetCDFReader(file);
    latitudes = reader.getDataVariable(latitudeField);
    longitudes = reader.getDataVariable(longitudeField);
    times = reader.getDataVariable(timeField);
  }

  for (let i = 0; i < times.length; i++) {
    if (!Number.isNaN(times[i]) && !Number.isNaN(latitudes[i])) {
      csvContent += `${times[i]},${latitudes[i]},${longitudes[i]}\n`;
    }
  }

  fs.writeFileSync(`${filePath}.csv`, csvContent);
};

export { netcdf2csv };
