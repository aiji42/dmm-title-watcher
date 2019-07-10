'use strict'

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const { Subscription } = require('../model/subscription')
const { Product } = require('../model/Product')
const initialSubscriptions = require('./initials/subscription.json')

describe('Products', () => {
  let subscriptionId = ''
  before(done => {
    Subscription.asyncCreate(initialSubscriptions[0])
      .then(subsc => {
        subscriptionId = subsc.get('id')
        done()
      })
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

  after(done => {
    Promise.all([Subscription.asyncTrancate(), Product.asyncTrancate()])
    .then(() => done())
  })
})