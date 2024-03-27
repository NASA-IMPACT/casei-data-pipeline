#!/bin/bash

yarn headers "$1"
bash make_csv.sh "$1"
yarn convert_all "$1"
