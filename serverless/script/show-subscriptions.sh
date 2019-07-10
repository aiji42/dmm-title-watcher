#!/bin/sh

if [ $# -ne 1 ]; then
  echo "IDをしていしてください。" 1>&2
  exit 1
fi
curl http://localhost:3000/subscriptions/$1