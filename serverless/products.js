'use strict'

const { Subscription } = require('./model/subscription')
const { Product } = require('./model/product')
const unmarshalItem = require('dynamodb-marshaler').unmarshalItem

module.exports.search = (event, context, callback) => {
  const ids = []
  if (event.httpMethod == 'POST') {
    ids.push(event.pathParameters.id)
  } else if ('Records' in event) {
    const tmpIds = event.Records.filter(record => record.eventName == 'INSERT').map(record => record.dynamodb.Keys.id.S)
    Array.prototype.push.apply(ids, tmpIds)
  }
  if (ids.length < 1) {
    callback(null, 'Do not need to search products')
    return
  }

  Subscription.asyncGetItems(ids)
    .then(subscriptions => {
      const getProducts = subscriptions.map(subscription => subscription.getProductsByAPI())
      Promise.all(getProducts).then(products => products[0].forEach(product => product.save()))
    })
    .then(() => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `Sucessfully search products ids: ${ids.join(', ')}`
        })
      })
    })
    .catch((err) => {
      console.error(err)
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to search products ids: ${id.join(', ')}`
        })
      })
    })
}

module.exports.searchAll = (event, context, callback) => {
  Subscription.getActiveItems()
    .then(subscriptions => {
      const pros = subscriptions.map(subscription => subscription.invokeProductsSearch())
      return Promise.all(pros)
    })
    .then(() => callback(null, 'Sucessfully search by all subscriptions'))
    .catch(err => {
      console.error(err)
      callback(null, 'Unable to search by all subscriptions')
    })
}

module.exports.notify = (event, context, callback) => {
  const records = event.Records.filter(record => record.eventName == 'INSERT')
  Promise.all(records.map(record => new Product(unmarshalItem(record.dynamodb.NewImage)).notifySlack()))
    .then(() => callback(null, 'Sucessfully product notify slack'))
    .catch(err => {
      console.log(err)
      callback(null, 'Unable to product notify slack')
    })
}