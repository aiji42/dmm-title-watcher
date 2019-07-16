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

const Torrent = dynamo.define('Torrent', {
  tableName: process.env.TABLE_TORRENTS,
  hashKey: 'productId',
  rangeKey: 'torrentId',
  timestamps : true,
  schema: {
    productId: Joi.string(),
    torrentId: Joi.string(),
    info: Joi.object(),
    status: Joi.string().regex(/pending|running|completed/).default('pending')
  }
})

const methods = ['get', 'getItems', 'create', 'update', 'destroy', 'createTable', 'deleteTable']
const models = [Subscription, Product, Bookmark, Torrent]
models.forEach(model => {
  methods.forEach(method => {
    const asyncMethod = `async${method.charAt(0).toUpperCase() + method.slice(1)}`
    model[asyncMethod] = util.promisify(model[method])
  })
})

module.exports.Subscription = Subscription
module.exports.Product = Product
module.exports.Bookmark = Bookmark
module.exports.Torrent = Torrent