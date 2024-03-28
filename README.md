# casei-data-pipeline

This repository hosts the code to download ADMG CASEI campaigns data from CMR portal and also a catalog of yaml files containing a list of deployments and files that need to be downloaded.

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

### Process a plaftorm file collection

After downloading the files, execute the following command to process all the files in a directory:

```
yarn process <DIR>
```

It's expected that the directory structure is `./<campaign>/<deployment>/<platform_name>`, so the metadata that will be associated with the features will be get from the folder structure.

All the data files will be converted and merged into a single GeoJSON file.

### Process a campaign file collection

We can process a campaign file collection with 

```
yarn process_all <DIR>
```

In this case, the `<DIR>` is the campaign folder, which contains the deployments and platforms as subdirectories. It will generate a single geojson file, named as `<CAMPAIGN>.geojson`.

### Convert a single file

We can also convert a single `.ict` or `.txt` file with the following command:

```
yarn convert <FILE>
```
