# casei-data-pipeline

This repository hosts the code to download ADMG CASEI campaigns data from CMR portal and also a catalog of yaml files containing a list of deployments and files that need to be download.

## How to use

Switch to the task directory and install the library:

```
cd task/
yarn install
```

Set your [NASA Earth Data Token](https://urs.earthdata.nasa.gov/) as an environment variable:

```
export EARTH_DATA_TOKEN="<token>"
```

Finally, you can download the campaign files with:

```
yarn download ../campaigns/<campaign_name>
```