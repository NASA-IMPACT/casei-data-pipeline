#!/bin/bash

yarn headers "$1"
yarn make_csv "$1"
yarn convert_all "$1"
