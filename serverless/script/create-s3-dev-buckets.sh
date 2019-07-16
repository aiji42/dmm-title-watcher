#!/bin/sh
trap "exit 1" INT

AWS_ENDPOINT_URL=http://s3:9000

BUCKETS="${BUCKET_TRANSMISSION_PROJECT}";
for BUCKET in $BUCKETS
do
  until aws s3 --endpoint-url ${AWS_ENDPOINT_URL} ls s3://${BUCKET} > /dev/null 2> /dev/null
  do
  echo "Creating bucket $BUCKET"
  aws s3 --endpoint-url ${AWS_ENDPOINT_URL} mb s3://${BUCKET} > /dev/null
  done &
done

wait

trap - INT