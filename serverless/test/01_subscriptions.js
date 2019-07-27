'use strict'

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const { Subscription } = require('../model/subscription')
const { Product } = require('../model/product')
const { Bookmark } = require('../model/bookmark')

describe('Subscriptions', () => {
  let subscriptionId = ''
  before(done => {
    (async () => {
      await Subscription.asyncCreateTable()
      await Bookmark.asyncCreateTable()
      await Product.asyncCreateTable()
      done()
    })()
  })

  describe('SubscribeActress', () => {
    const wrapped = mochaPlugin.getWrapper('subscriptionsSubscribeActress', '/subscriptions.js', 'subscribeActress')
    it('Regular request returns status code 200', () => {
      return wrapped.run({id: '1025419'}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('BulkSearchProducts', () => {
    const wrapped = mochaPlugin.getWrapper('subscriptionsBulkSearchProducts', '/subscriptions.js', 'bulkSearchProducts')
    it('Regular request succeed', () => {
      return wrapped.run({}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('SearchProducts', () => {
    before(done => {
      (async () => {
        const subscriptions = (await Subscription.asyncAll(['id', 'name'])).Items
        subscriptions.forEach(subscription => {
          if (subscription.get('name') == '新着 天使もえ') subscriptionId = subscription.get('id')
        })
        done()
      })()
    })

    const wrapped = mochaPlugin.getWrapper('subscriptionsSearchProducts', '/subscriptions.js', 'searchProducts')
    it('Not found subscription returns status code 404', () => {
      return wrapped.run({id: '0'}).then(response => expect(response.statusCode).to.be.equal(404))
    })

    it('Regular request returns status code 200', () => {
      return wrapped.run({id: subscriptionId}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('SubscribeGenre', () => {
    const wrapped = mochaPlugin.getWrapper('subscriptionsSubscribeGenre', '/subscriptions.js', 'subscribeGenre')
    it('Regular request returns status code 200', () => {
      return wrapped.run({keyword: 'でびゅーさくひん'}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('Index', () => {
    const wrapped = mochaPlugin.getWrapper('subscriptionsIndex', '/subscriptions.js', 'index')
    it('Regular request returns status code 200', () => {
      return wrapped.run({}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('Delete', () => {
    const wrapped = mochaPlugin.getWrapper('subscriptionsDelete', '/subscriptions.js', 'delete')
    it('Not found subscription returns status code 404', () => {
      return wrapped.run({id: '0'}).then(response => expect(response.statusCode).to.be.equal(404))
    })

    it('Regular request returns status code 200', () => {
      return wrapped.run({id: subscriptionId}).then(response => expect(response.statusCode).to.be.equal(200))
    })

    it('Deleted Subscription', () => {
      return Subscription.asyncGet(subscriptionId).then(subscription => expect(subscription).to.be.null)
    })
  })

  after(done => {
    (async () => {
      await Subscription.asyncDeleteTable()
      await Bookmark.asyncDeleteTable()
      await Product.asyncDeleteTable()
      done()
    })()
  })
})