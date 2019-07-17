'use strict'

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const marshaler = require('dynamodb-marshaler')
const { Subscription } = require('../model/subscription')
const { Product } = require('../model/product')
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
      await Torrent.asyncCreateTable()
      subscriptionId = (await Subscription.asyncCreate(initialSubscriptions[0])).get('id')
      await Product.asyncCreate(initialProduct)
      done()
    })()
  })

  describe('Search', () => {
    const stream = {
      Records: [
        { eventName: 'INSERT', dynamodb: { Keys: { id: { S: '' } } } }
      ]
    }
    before(done => {
      stream.Records[0].dynamodb.Keys.id.S = subscriptionId
      done()
    })

    const wrapped = mochaPlugin.getWrapper('productsSearch', '/products.js', 'search')
    it('Regular request by stream returns status code 200', () => {
      return wrapped.run(stream).then(response => expect(response.statusCode).to.be.equal(200))
    })

    it('Regular request by POST method returns status code 200', () => {
      return wrapped.run({httpMethod: 'POST', pathParameters: {id: stream.Records[0].dynamodb.Keys.id.S}}).then(response => expect(response.statusCode).to.be.equal(200))
    })

    it('Subscription failedCount is 0', () => {
      return Subscription.asyncGet(subscriptionId).then(subscription => expect(subscription.get('failedCount')).to.be.equal(0))
    })

    let invalidSubscriptionId = ''
    it('Regular request by stream but irreglar subscription returns status code 500', () => {
      initialSubscriptions[0].condition.hits = 0
      return Subscription.asyncCreate(initialSubscriptions[0]).then(subscription => {
        stream.Records[0].dynamodb.Keys.id.S = invalidSubscriptionId = subscription.get('id')
        return wrapped.run(stream).then(response => expect(response.statusCode).to.be.equal(500))
      })
    })

    it('Subscription failedCount is 1', () => {
      return Subscription.asyncGet(invalidSubscriptionId).then(subscription => expect(subscription.get('failedCount')).to.be.equal(1))
    })

    it('Regular request by stream but don\'t need to search', () => {
      stream.Records[0].eventName = 'MODIFY'
      return wrapped.run(stream).then(response => expect(response).to.be.equal('Do not need to search products'))
    })

    it('Bad request by POST method not found returns status code 404', () => {
      return wrapped.run({httpMethod: 'POST', pathParameters: {id: '0'}}).then(response => expect(response.statusCode).to.be.equal(404))
    })
  })

  describe('SearchAll', () => {
    const wrapped = mochaPlugin.getWrapper('productsSearchAll', '/products.js', 'searchAll')
    it('Regular request succeed', () => {
      return wrapped.run({}).then(response => expect(response).to.be.equal('Sucessfully search by all subscriptions'))
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
      return wrapped.run(stream).then(response => expect(response).to.be.equal('Sucessfully product notify slack'))
    })

  })

  describe('RemindNotify', () => {
    const wrapped = mochaPlugin.getWrapper('productsRemindNotify', '/products.js', 'remindNotify')
    it('Regular request succeed', () => {
      return wrapped.run({productId: initialProduct.id}).then(response => expect(response).to.be.equal('Sucessfully product remind notify slack'))
    })
  })

  describe('SearchTorrentAndNotify', () => {
    const wrapped = mochaPlugin.getWrapper('productsSearchTorrentAndNotify', '/products.js', 'searchTorrentAndNotify')
    it('Regular request succeed', () => {
      return wrapped.run({productId: initialProduct.id}).then(response => expect(response).to.be.equal('Sucessfully product search torrent and notify slack'))
    })
  })

  after(done => {
    (async () => {
      await Product.asyncDeleteTable()
      await Subscription.asyncDeleteTable()
      await Torrent.asyncDeleteTable()
      done()
    })()
  })
})