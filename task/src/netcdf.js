const fs = require('fs');
const hdf5 = require("jsfive");
const { NetCDFReader } = require("netcdfjs");

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

  fs.writeFileSync(filePath.replace('.nc', '.csv'), csvContent);
};

module.exports = {
  netcdf2csv,
};
