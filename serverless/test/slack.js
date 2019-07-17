'use strict'

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const { Product } = require('../model/product')
const { Bookmark } = require('../model/bookmark')
const { Subscription } = require('../model/subscription')
const initialProducts = require('./initials/product.json')
const initialSubscriptions = require('./initials/subscription.json')
const initialSlack = require('./initials/slack.json')

describe('Slack', () => {
  before(done => {
    (async () => {
      await Product.asyncCreateTable()
      await Bookmark.asyncCreateTable()
      await Subscription.asyncCreateTable()
      await Product.asyncCreate(initialProducts[0])
      await Subscription.asyncCreate(initialSubscriptions[0])
      done()
    })()
  })

  describe('ActionEndpoint', () => {
    const wrapped = mochaPlugin.getWrapper('slackActionEndpoint', '/slack.js', 'actionEndpoint')
    it('Regular request (create bookmark) returns status code 200', () => {
      return wrapped.run({body: `payload=${JSON.stringify(initialSlack[0])}`}).then(response => {
        expect(response.statusCode).to.be.equal(200)
        expect(response.body).to.include('"name":"delete"')
      })
    })
    it('Regular request (delete bookmark) returns status code 200', () => {
      return wrapped.run({body: `payload=${JSON.stringify(initialSlack[1])}`}).then(response => {
        expect(response.statusCode).to.be.equal(200)
        expect(response.body).to.include('"name":"create"')
      })
    })
    it('Regular request (subscribe actress) returns status code 200', () => {
      console.log(initialSlack[2])
      return wrapped.run({body: `payload=${JSON.stringify(initialSlack[2])}`}).then(response => {
        expect(response.statusCode).to.be.equal(200)
        expect(response.body).to.include('Sucessfully subscribe')
      })
    })
  })

  describe('Command', () => {
    const wrapped = mochaPlugin.getWrapper('slackCommand', '/slack.js', 'command')
    it('Regular request (/subscriptions) returns status code 200', () => {
      return wrapped.run({body: 'command=/subscriptions'}).then(response => {
        expect(response.statusCode).to.be.equal(200)
        expect(response.body).to.include('name')
      })
    })
    it('Regular request (/actress) returns status code 200', () => {
      return wrapped.run({body: 'command=/actress&text=深田えいみ'}).then(response => {
        expect(response.statusCode).to.be.equal(200)
        expect(response.body).to.include('title')
      })
    })
  })

  after(done => {
    (async () => {
      await Product.asyncDeleteTable()
      await Bookmark.asyncDeleteTable()
      await Subscription.asyncDeleteTable()
      done()
    })()
  })
})