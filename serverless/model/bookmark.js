'use strict'

const AWS = require('aws-sdk')
const { Bookmark } = require('./table-schema')
const { Product } = require('./product')

Bookmark.scanRemindable = function() {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, today.getHours(), today.getMinutes(), today.getSeconds())
  return new Promise((resolve, reject) => {
    Bookmark.scan()
      .where('saleStartDate').between(yesterday, today)
      .exec((err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
  })
}

Bookmark.scanTorrentable = function() {
  const today = new Date()
  return new Promise((resolve, reject) => {
    Bookmark.scan()
      .where('saleStartDate').lt(today)
      .exec((err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
  })
}

Bookmark.prototype.invokRemindNotify = function() {
  const lambda = new AWS.Lambda({endpoint: process.env.GW_URL})
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_PRODUCTS_REMIND_NOTIFY,
    InvocationType: 'Event',
    Payload: JSON.stringify({productId: this.get('productId')})
  }).promise()
}

Bookmark.prototype.invokeSearchTorrentAndNotify = function() {
  const lambdaConfig = {}
  if (process.env.STAGE != 'prod') lambdaConfig.endpoint = process.env.GW_URL
  const lambda = new AWS.Lambda(lambdaConfig)
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_PRODUCTS_SEARCH_TORRENT_AND_NOTIFY,
    InvocationType: 'Event',
    Payload: JSON.stringify({productId: this.get('productId')})
  }).promise()
}

Bookmark.prototype.getProduct = function() {
  return new Product({id: this.get('productId'), info: this.get('productInfo')})
}

module.exports.Bookmark = Bookmark