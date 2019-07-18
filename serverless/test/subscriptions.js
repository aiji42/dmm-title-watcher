'use strict'

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const initialSubscriptions = require('./initials/subscription.json')
const { Subscription } = require('../model/subscription')

describe('Subscriptions', () => {
  const initialSubscription = initialSubscriptions[0]
  let targetId1 = ''
  let targetId2 = ''
  before(done => {
    (async () => {
      await Subscription.asyncCreateTable()
      done()
    })()
  })

  describe('Create', () => {
    const wrapped = mochaPlugin.getWrapper('subscriptionsCreate', '/subscriptions.js', 'create')
    it('Bad request returns status code 400 - body.name is not String', () => {
      const irregularBody  = Object.assign({}, initialSubscription)
      irregularBody.name = 1234
      return wrapped.run({body: JSON.stringify(irregularBody)}).then(response => expect(response.statusCode).to.be.equal(400))
    })

    it('Bad request returns status code 400 - body.condition is not Object', () => {
      const irregularBody  = Object.assign({}, initialSubscription)
      irregularBody.condition = 'hogehoge'
      return wrapped.run({body: JSON.stringify(irregularBody)}).then(response => expect(response.statusCode).to.be.equal(400))
    })

    it('Bad request returns status code 400 - body.exceptCondition is not Object', () => {
      const irregularBody  = Object.assign({}, initialSubscription)
      irregularBody.exceptCondition = 'hogehoge'
      return wrapped.run({body: JSON.stringify(irregularBody)}).then(response => expect(response.statusCode).to.be.equal(400))
    })

    it('Regular request returns status code 200', () => {
      return wrapped.run({body: JSON.stringify(initialSubscription)}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('SubscribeActress', () => {
    const wrapped = mochaPlugin.getWrapper('subscriptionsSubscribeActress', '/subscriptions.js', 'subscribeActress')
    it('Regular request returns status code 200', () => {
      return wrapped.run({pathParameters: {id: '1025419'}}).then(response => expect(response.statusCode).to.be.equal(200))
    })

    it('Regular request with slack true returns status code 200', () => {
      return wrapped.run({pathParameters: {id: '1025419'}, slack: true}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('Index', () => {
    const wrapped = mochaPlugin.getWrapper('subscriptionsIndex', '/subscriptions.js', 'index')
    it('Regular request returns status code 200', () => {
      return wrapped.run({}).then(response => {
        targetId1 = JSON.parse(response.body)[0].id
        targetId2 = JSON.parse(response.body)[1].id
        expect(response.statusCode).to.be.equal(200)
      })
    })
    it('Regular request with slack true returns status code 200', () => {
      return wrapped.run({slack: true}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('Show', () => {
    const wrapped = mochaPlugin.getWrapper('subscriptionsShow', '/subscriptions.js', 'show')
    it('Not found subscription returns status code 404', () => {
      return wrapped.run({pathParameters: {id: '0'}}).then(response => expect(response.statusCode).to.be.equal(404))
    })

    it('Regular request returns status code 200', () => {
      return wrapped.run({pathParameters: {id: targetId1}}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('Delete', () => {
    const wrapped = mochaPlugin.getWrapper('subscriptionsDelete', '/subscriptions.js', 'delete')
    it('Not found subscription returns status code 404', () => {
      return wrapped.run({pathParameters: {id: '0'}}).then(response => expect(response.statusCode).to.be.equal(404))
    })

    it('Regular request returns status code 200', () => {
      return wrapped.run({pathParameters: {id: targetId1}}).then(response => expect(response.statusCode).to.be.equal(200))
    })

    it('Regular request with slack true returns status code 200', () => {
      return wrapped.run({pathParameters: {id: targetId2}, slack: true}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  after(done => {
    (async () => {
      await Subscription.asyncDeleteTable()
      done()
    })()
  })
})