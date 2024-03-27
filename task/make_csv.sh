#!/bin/bash

OIFS="$IFS"
# necessary to avoid problems when the directory or filename has a space
IFS=$'\n'

headers_file="$1/headers.csv"

for f in `find "$1" -type f -name "*.txt"`;
do
    new_name="${f%.txt}".csv;
    cat $headers_file $f > $new_name;
done

for f in `find "$1" -type f -name "*.ict"`;
do
    yarn split_ict "$f";
done

IFS="$OIFS"
