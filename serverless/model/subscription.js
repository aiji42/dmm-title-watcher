'use strict'

const AWS = require('aws-sdk')
const { SlackClient } = require('../util/slack-client')
const { Subscription } = require('./table-schema')
const { Product } = require('./product')
const { DMMClient } = require('../util/dmm-client')
const lambdaConfig = {}
if (process.env.STAGE != 'prod') lambdaConfig.endpoint = process.env.GW_URL
const lambda = new AWS.Lambda(lambdaConfig)

Subscription.defaultCondition = {
  site: "FANZA",
  service: "digital",
  floor: "videoa",
  article: null,
  article_id: null,
  gte_date: "#TODAY",
  hits: 100
}

Subscription.defaultExceptCondition = {
  genre: [3036, 6793]
}

Subscription.prototype.searchProductsAndNotify = async function() {
  const productDatas = await this.searchProducts()
  let products = await Promise.all(productDatas.map(data => Product.createOnlyNew({id: data.product_id, info: data})))
  products = products.filter(product => product)
  if (products.length > 0) await SlackClient.postSubscriptionSearchProducts(this, products)
}

Subscription.prototype.searchProducts = async function() {
  try {
    const items = (await DMMClient.asyncProduct(this.preparedCondition())).result.items
    return items.filter(item => ! this.isMatchedExcept(item))
  } catch (err) {
    throw err
  }
}

Subscription.prototype.preparedCondition = function() {
  const condition = this.get('condition')
  Object.keys(condition).forEach(key => {
    if (typeof condition[key] != 'string') return
    condition[key] = condition[key].replace(/#TODAY/, '2019-10-01T15:28:01')
    // condition[key] = condition[key].replace(/#TODAY/, new Date().toISOString().slice(0, 19))
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

Subscription.invokeIndex = function() {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_INDEX,
    InvocationType: 'Event',
    Payload: JSON.stringify()
  }).promise()
}

Subscription.invokeDelete = function(id) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_DELETE,
    InvocationType: 'Event',
    Payload: JSON.stringify({id: id})
  }).promise()
}

Subscription.invokeSubscribeActress = function(id) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_SUBSCRIBE_ACTRESS,
    InvocationType: 'Event',
    Payload: JSON.stringify({id: id})
  }).promise()
}

Subscription.invokeSubscribeGenre = function(keyword) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_SUBSCRIBE_GENRE,
    InvocationType: 'Event',
    Payload: JSON.stringify({keyword: keyword})
  }).promise()
}

Subscription.invokeSearchProducts = function(id) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_SEARCH_PRODUCTS,
    InvocationType: 'Event',
    Payload: JSON.stringify({id: id})
  }).promise()
}

Subscription.prototype.invokeSearchProducts = function() {
  return Subscription.invokeSearchProducts(this.get('id'))
}

module.exports.Subscription = Subscription