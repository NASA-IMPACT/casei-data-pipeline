# casei-data-pipeline

This repository hosts the code to download and process the ADMG CASEI campaigns navigational data from CMR portal and also a catalog of yaml files containing a list of deployments and files. Furthermore, we store the static platforms location data in a set of CSV files.

## How to use

### Installation
Switch to the task directory and install the library:

```
cd task/
yarn install
```

Set your [NASA Earth Data Token](https://urs.earthdata.nasa.gov/) as an environment variable:

```
export EARTH_DATA_TOKEN="<token>"
```

### Downloading data

You can download the campaign files with:

```
yarn download ../campaigns/<campaign_name>
```

### Process a campaign file collection

We can process a campaign file collection with 

```
yarn process_all ../campaigns/<campaign_name>
```

In this case, the `<DIR>` is the campaign folder, which contains the deployments and platforms as subdirectories. It will generate a single geojson file, named as `<CAMPAIGN>.geojson`.

### Convert a XLSX file to a set of CSVs

The command `yarn xls2csv <FILE>` can be used to convert a XLSX file to CSV. On this case, each spreadsheet in the file will be exported to CSV, directly in the `campaigns` folder.

Example of XLSX file: https://docs.google.com/spreadsheets/d/17v-ZfeWoPZoCAVSs57Y3Q1gKUe6S49fZ8rC2KOO_myY/edit?usp=sharing
