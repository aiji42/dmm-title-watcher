'use strict'

const dynamo = require('dynamodb')
const Joi = require('joi')
let config = {}
if (process.env.STAGE != 'prod') {
  config = {
    region: 'localhost',
    endpoint: 'http://dynamodb:8000'
  }
}
dynamo.AWS.config.update(config)
const util = require('util')


const Subscription = dynamo.define('Subscription', {
  tableName: process.env.TABLE_SUBSCRIPTIONS,
  hashKey: 'id',
  timestamps : true,
  schema: {
    id: dynamo.types.uuid(),
    name: Joi.string(),
    condition: Joi.object(),
    exceptCondition: Joi.object(),
    failedCount: Joi.number().default(0)
  }
})

const Product = dynamo.define('Product', {
  tableName: process.env.TABLE_PRODUCTS,
  hashKey: 'id',
  timestamps : true,
  schema: {
    id: Joi.string(),
    info: Joi.object()
  }
})

const Bookmark = dynamo.define('Bookmark', {
  tableName: process.env.TABLE_BOOKMARKS,
  hashKey: 'productId',
  timestamps : true,
  schema: {
    productId: Joi.string(),
    saleStartDate: Joi.date(),
    productInfo: Joi.object()
  }
})

const methods = ['get', 'getItems', 'create', 'update', 'destroy']
const models = [Subscription, Product, Bookmark]
models.forEach(model => {
  methods.forEach(method => {
    const asyncMethod = `async${method.charAt(0).toUpperCase() + method.slice(1)}`
    model[asyncMethod] = util.promisify(model[method])
  })
})

function asyncAll(attributes) {
  return new Promise((resolve, reject) => {
    this.scan()
        .attributes(attributes)
        .exec((err, data) => {
          if (err) reject(err)
          else resolve(data)
        })
  })
}

function asyncTrancate() {
  return this.asyncAll(['id'])
    .then(data => {
      return Promise.all(data.Items.map(m => this.asyncDestroy(m.get('id'))))
    })
}

models.forEach(model => {
  model['asyncAll'] = asyncAll
  model['asyncTrancate'] = asyncTrancate
})

module.exports.Subscription = Subscription
module.exports.Product = Product
module.exports.Bookmark = Bookmark