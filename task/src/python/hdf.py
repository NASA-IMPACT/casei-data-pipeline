import sys
import csv
from os.path import splitext
from pyhdf.SD import SD, SDC


def convert_hdf(
    file_path,
    datasets="GreenwichMeanTime,AircraftLatitude,AircraftLongitude"
        ):
    # Open the HDF5 file
    file = SD(file_path, SDC.READ)
    datasets = [
        file.select(d)[:].tolist() for d in datasets.split(",")
    ]

    root, _ = splitext(file_path)
    csv_path = root + ".csv"
    # Write to CSV
    with open(csv_path, "w", newline="") as csvfile:
        writer = csv.writer(csvfile)

        writer.writerow(["time", "latitude", "longitude"])

        for time, lat, lon in zip(datasets[0], datasets[1], datasets[2]):
            writer.writerow([time, lat, lon])


if __name__ == "__main__":
    if len(sys.argv) > 2:
        convert_hdf(sys.argv[1], sys.argv[2])
    elif len(sys.argv) == 2:
        convert_hdf(sys.argv[1])
