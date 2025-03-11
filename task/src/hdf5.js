const fs = require('fs');
const hdf5 = require('jsfive');

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
const hdf52csv = (filePath, latitudeField = 'latitude', longitudeField = 'longitude', timeField = 'time') => {
  const file = fs.readFileSync(filePath);
  let csvContent = 'time,latitude,longitude\n';

  // Deal with NetCDF-4 files
  const data = new hdf5.File(file.buffer).get('Nav_Data');

  const latitudes = data.values.find((i) => i.name === latitudeField).value;
  const longitudes = data.values.find((i) => i.name === longitudeField).value;
  const times = data.values.find((i) => i.name === timeField).value;

  for (let i = 0; i < times.length; i++) {
    if (!Number.isNaN(times[i]) && !Number.isNaN(latitudes[i])) {
      csvContent += `${times[i]},${latitudes[i]},${longitudes[i]}\n`;
    }
  }

  fs.writeFileSync(filePath.replace('.h5', '.csv'), csvContent);
};

module.exports = {
  hdf52csv,
};
