#!/bin/sh
trap "exit 1" INT

AWS_ENDPOINT_URL=http://dynamodb:8000

TABLES="dmm-title-watcher-dev-products dmm-title-watcher-dev-subscriptions dmm-title-watcher-dev-bookmarks dmm-title-watcher-dev-torrents";
for TABLE in $TABLES
do
  until aws dynamodb  --endpoint-url ${AWS_ENDPOINT_URL} describe-table --table-name ${TABLE} > /dev/null 2> /dev/null
  do
  echo "Creating table $TABLE"
  if [ "$TABLE" = "dmm-title-watcher-dev-products" ]; then
    aws dynamodb --endpoint-url ${AWS_ENDPOINT_URL} create-table \
      --table-name ${TABLE} \
      --attribute-definitions AttributeName=id,AttributeType=S \
      --key-schema AttributeName=id,KeyType=HASH \
      --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
      --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
      > /dev/null 2> /dev/null
  elif [ "$TABLE" = "dmm-title-watcher-dev-subscriptions" ]; then
    aws dynamodb --endpoint-url ${AWS_ENDPOINT_URL} create-table \
      --table-name ${TABLE} \
      --attribute-definitions AttributeName=id,AttributeType=S \
      --key-schema AttributeName=id,KeyType=HASH \
      --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
      --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
      > /dev/null 2> /dev/null
  elif [ "$TABLE" = "dmm-title-watcher-dev-bookmarks" ]; then
    aws dynamodb --endpoint-url ${AWS_ENDPOINT_URL} create-table \
      --table-name ${TABLE} \
      --attribute-definitions AttributeName=productId,AttributeType=S \
      --key-schema AttributeName=productId,KeyType=HASH \
      --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
      --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
      > /dev/null 2> /dev/null
  elif [ "$TABLE" = "dmm-title-watcher-dev-torrents" ]; then
    aws dynamodb --endpoint-url ${AWS_ENDPOINT_URL} create-table \
      --table-name ${TABLE} \
      --attribute-definitions '[{"AttributeName":"productId","AttributeType":"S"},{"AttributeName":"torrentId","AttributeType":"S"}]' \
      --key-schema '[{"AttributeName":"productId","KeyType":"HASH"},{"AttributeName":"torrentId","KeyType":"RANGE"}]' \
      --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
      --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
      > /dev/null 2> /dev/null
  fi
  done &
done

wait

trap - INT
