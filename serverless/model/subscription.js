'use strict'

const AWS = require('aws-sdk')
const util = require('util')
const { Subscription } = require('./table-schema')
const { Product } = require('./product')
const { DMMClient } = require('../util/dmm-client')
const lambdaConfig = {}
if (process.env.STAGE != 'prod') lambdaConfig.endpoint = process.env.GW_URL
const lambda = new AWS.Lambda(lambdaConfig)

Subscription.prototype.getProductsByAPI = async function() {
  try {
    const items = (await DMMClient.asyncProduct(this.preparedCondition())).result.items
    await Subscription.asyncUpdate({id: this.get('id'), failedCount: 0})
    return items.filter(item => ! this.isMatchedExcept(item)).map(item => new Product({id: item.product_id, info: item}))
  } catch (err) {
    await Subscription.asyncUpdate({id: this.get('id'), failedCount: this.get('failedCount') + 1})
    if (err.message != 'API error: 400 unknown error') throw err
    return []
  }
}

Subscription.prototype.preparedCondition = function() {
  const condition = this.get('condition')
  Object.keys(condition).forEach(key => {
    if (typeof condition[key] != 'string') return
    condition[key] = condition[key].replace(/#TODAY/, new Date().toISOString().slice(0, 19))
  })
  return condition
}

Subscription.prototype.isMatchedExcept = function(product) {
  const excepts = this.get('exceptCondition')
  return Object.keys(excepts).map(key => {
    if (! (key in product.iteminfo)) return false
    return excepts[key].map(except => {
      return product.iteminfo[key].map(info => info.id).includes(except)
    }).some(res => res)
  }).some(res => res)
}

Subscription.prototype.invokeSearch = function(options = {}) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_SEARCH,
    InvocationType: 'Event',
    Payload: JSON.stringify({id: this.get('id'), ...options})
  }).promise()
}

Subscription.invokeCreate = function(data, options = {}) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_CREATE,
    InvocationType: 'Event',
    Payload: JSON.stringify({body: JSON.stringify(data), ...options})
  }).promise()
}

Subscription.invokeIndex = function(options) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_INDEX,
    InvocationType: 'Event',
    Payload: JSON.stringify(options)
  }).promise()
}

Subscription.invokeDelete = function(id, options = {}) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_DELETE,
    InvocationType: 'Event',
    Payload: JSON.stringify({pathParameters: {id: id}, ...options})
  }).promise()
}

Subscription.invokeSubscribeActress = function(id, options = {}) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_SUBSCRIBE_ACTRESS,
    InvocationType: 'Event',
    Payload: JSON.stringify({pathParameters: {id: id}, ...options})
  }).promise()
}

Subscription.getActiveItems = function() {
  return new Promise((resolve, reject) => {
    this.scan()
        .where('failedCount').lte(9)
        .exec((err, data) => {
          if (err) reject(err)
          else resolve(data.Items)
        })
  })
}

Subscription.asyncAll = function(attributes) {
  return new Promise((resolve, reject) => {
    this.scan()
        .attributes(attributes)
        .exec((err, data) => {
          if (err) reject(err)
          else resolve(data)
        })
  })
}

module.exports.Subscription = Subscription