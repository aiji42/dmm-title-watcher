'use strict'

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const { Product } = require('../model/product')
const { Bookmark } = require('../model/bookmark')
const initialProducts = require('./initials/product.json')
const initialSlack = require('./initials/slack.json')

describe('Slack', () => {
  const initialProduct = initialProducts[0]
  before(done => {
    (async () => {
      await Product.asyncCreateTable()
      await Bookmark.asyncCreateTable()
      await Product.asyncCreate(initialProduct)
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
  })

  after(done => {
    (async () => {
      await Product.asyncDeleteTable()
      await Bookmark.asyncDeleteTable()
      done()
    })()
  })
})