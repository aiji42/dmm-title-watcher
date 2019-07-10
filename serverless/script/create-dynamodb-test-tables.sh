#!/bin/sh
trap "exit 1" INT

AWS_ENDPOINT_URL=http://dynamodb:8000

TABLES="dmm-title-watcher-test-products dmm-title-watcher-test-subscriptions dmm-title-watcher-test-bookmarks";
for TABLE in $TABLES
do
  until aws dynamodb  --endpoint-url ${AWS_ENDPOINT_URL} describe-table --table-name ${TABLE} > /dev/null 2> /dev/null
  do
  echo "Creating table $TABLE"
  if [ "$TABLE" = "dmm-title-watcher-test-products" ]; then
    aws dynamodb --endpoint-url ${AWS_ENDPOINT_URL} create-table \
      --table-name ${TABLE} \
      --attribute-definitions AttributeName=id,AttributeType=S \
      --key-schema AttributeName=id,KeyType=HASH \
      --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
      > /dev/null 2> /dev/null
  elif [ "$TABLE" = "dmm-title-watcher-test-subscriptions" ]; then
    aws dynamodb --endpoint-url ${AWS_ENDPOINT_URL} create-table \
      --table-name ${TABLE} \
      --attribute-definitions AttributeName=id,AttributeType=S \
      --key-schema AttributeName=id,KeyType=HASH \
      --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
      > /dev/null 2> /dev/null
  elif [ "$TABLE" = "dmm-title-watcher-test-bookmarks" ]; then
    aws dynamodb --endpoint-url ${AWS_ENDPOINT_URL} create-table \
      --table-name ${TABLE} \
      --attribute-definitions AttributeName=productId,AttributeType=S \
      --key-schema AttributeName=productId,KeyType=HASH \
      --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
      > /dev/null 2> /dev/null
  fi
  done &
done

wait

trap - INT
