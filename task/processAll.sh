#!/bin/bash

OIFS="$IFS"
# necessary to avoid problems when the directory or filename has a space
IFS=$'\n'

# Process each platform
for i in `find $1 -type d  -mindepth 2`;
do
    yarn process "$i";
done;

# Convert static location file to geojson
if test -s $1/static.csv;
    then yarn convert $1/static.csv;
fi;

for i in `find $1 -type f -name "*.geojson" -mindepth 2`;
do
    mv $i $1;
done;

DIR=$(echo "$1" | sed 's:/*$::')
CAMPAIGN_GEOJSON=${DIR##*/}.geojson

# Avoid merging a previous campaign geojson
if test -s $DIR/$CAMPAIGN_GEOJSON;
    then rm $DIR/$CAMPAIGN_GEOJSON;
fi;

yarn merge $DIR $CAMPAIGN_GEOJSON

IFS="$OIFS"
