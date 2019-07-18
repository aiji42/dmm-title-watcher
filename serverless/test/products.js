'use strict'

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const marshaler = require('dynamodb-marshaler')
const { Subscription } = require('../model/subscription')
const { Product } = require('../model/product')
const { Bookmark } = require('../model/bookmark')
const { Torrent } = require('../model/torrent')
const initialSubscriptions = require('./initials/subscription.json')
const initialProducts = require('./initials/product.json')

describe('Products', () => {
  let subscriptionId = ''
  const initialProduct = initialProducts[0]
  before(done => {
    (async () => {
      await Subscription.asyncCreateTable()
      await Product.asyncCreateTable()
      await Bookmark.asyncCreateTable()
      await Torrent.asyncCreateTable()
      subscriptionId = (await Subscription.asyncCreate(initialSubscriptions[0])).get('id')
      await Product.asyncCreate(initialProduct)
      done()
    })()
  })

  describe('Search', () => {
    const wrapped = mochaPlugin.getWrapper('productsSearch', '/products.js', 'search')
    it('Regular request returns status code 200', () => {
      return wrapped.run({id: subscriptionId}).then(response => expect(response.statusCode).to.be.equal(200))
    })

    it('Subscription failedCount is 0', () => {
      return Subscription.asyncGet(subscriptionId).then(subscription => expect(subscription.get('failedCount')).to.be.equal(0))
    })

    let invalidSubscriptionId = ''
    it('Regular request by stream but irreglar subscription returns status code 500', () => {
      initialSubscriptions[0].condition.hits = 0
      return Subscription.asyncCreate(initialSubscriptions[0]).then(subscription => {
        invalidSubscriptionId = subscription.get('id')
        return wrapped.run({id: invalidSubscriptionId}).then(response => expect(response.statusCode).to.be.equal(500))
      })
    })

    it('Subscription failedCount is 1', () => {
      return Subscription.asyncGet(invalidSubscriptionId).then(subscription => expect(subscription.get('failedCount')).to.be.equal(1))
    })
  })

  describe('SearchAll', () => {
    const wrapped = mochaPlugin.getWrapper('productsSearchAll', '/products.js', 'searchAll')
    it('Regular request succeed', () => {
      return wrapped.run({}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('Notify', () => {
    const wrapped = mochaPlugin.getWrapper('productsNotify', '/products.js', 'notify')
    const stream = {
      Records: [
        { eventName: 'INSERT', dynamodb: { NewImage: marshaler.marshalItem(initialProduct) } }
      ]
    }
    it('Regular request succeed', () => {
      return wrapped.run(stream).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('RemindNotify', () => {
    const wrapped = mochaPlugin.getWrapper('productsRemindNotify', '/products.js', 'remindNotify')
    it('Regular request succeed', () => {
      return wrapped.run({productId: initialProduct.id}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('SearchTorrentAndNotify', () => {
    const wrapped = mochaPlugin.getWrapper('productsSearchTorrentAndNotify', '/products.js', 'searchTorrentAndNotify')
    it('Regular request succeed', () => {
      return wrapped.run({productId: initialProduct.id}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  after(done => {
    (async () => {
      await Product.asyncDeleteTable()
      await Subscription.asyncDeleteTable()
      await Bookmark.asyncDeleteTable()
      await Torrent.asyncDeleteTable()
      done()
    })()
  })
})