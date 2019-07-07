'use strict'

const request = require('request')
const { Subscription } = require('./table-schema')
const { Product } = require('./product')
const { DMMClient } = require('../util/dmm-client')

Subscription.prototype.getProductsByAPI = function() {
  return new Promise((resolve, reject) => {
    DMMClient.asyncProduct(this.preparedCondition())
      .then(data => {
        Subscription.update({id: this.get('id'), failedCount: 0})
        const products = []
        data.result.items.forEach(product => {
          if (this.isMatchedExcept(product)) return
          products.push(new Product({id: product.product_id, info: product}))
        })
        resolve(products)
      })
      .catch(err => {
        Subscription.update({id: this.get('id'), failedCount: this.get('failedCount') + 1})
        reject(err)
      })
  })
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

Subscription.prototype.invokeProductsSearch = function() {
  const url = `${process.env.GW_URL}/subscriptions/${this.get('id')}/products/search`
  const req = util.promisify(request)
  return req({url: url, method: 'POST'})
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

Subscription.all = function(attributes) {
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