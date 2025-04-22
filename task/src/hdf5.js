import fs from 'fs';
import * as hdf5 from 'jsfive';

/**
* Load a HDF5 file and return its content as a file buffer.
* @param {String} filePath - path to a HDF5 file
*/
const loadHdf5 = (filePath) => {
  const file = fs.readFileSync(filePath);
  return new hdf5.File(file.buffer);
};

/**
* Converts a HDF5 file to CSV, extracting the time, latitude and longitude information.
* @param {String} filePath - path to a HDF5 file
* @param {String} latitudeField - name of the field in the NetCDF file that contains the
  latitude information
* @param {String} longitudeField - name of the field in the NetCDF file that contains the
  longitude information
* @param {String} timeField - name of the field in the NetCDF file that contains the
  time information
*/
const hdf52csv = (
  filePath,
  latitudeField = '/Nav_Data/gps_lat',
  longitudeField = '/Nav_Data/gps_lon',
  timeField = '/Nav_Data/gps_time'
) => {
  let data;
  try {
    data = loadHdf5(filePath).get('Nav_Data');
  } catch (e) {
    data = loadHdf5(filePath).get('GEOLOCATION_PARAMETERS');
  }

  let csvContent = 'time,latitude,longitude\n';
  const latitudes = data.values.find((i) => i.name === latitudeField).value;
  const longitudes = data.values.find((i) => i.name === longitudeField).value;
  const times = data.values.find((i) => i.name === timeField).value;

  for (let i = 0; i < times.length; i++) {
    if (!Number.isNaN(times[i]) && !Number.isNaN(latitudes[i])) {
      csvContent += `${times[i]},${latitudes[i]},${longitudes[i]}\n`;
    }
  }

  fs.writeFileSync(`${filePath}.csv`, csvContent);
};

export {
  hdf52csv,
  loadHdf5,
};
