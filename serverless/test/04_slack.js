'use strict'

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const { Product } = require('../model/product')
const { Bookmark } = require('../model/bookmark')
const { Subscription } = require('../model/subscription')
const { Torrent } = require('../model/torrent')
const initialProducts = require('./initials/product.json')
const initialSubscriptions = require('./initials/subscription.json')
const initialTorrents = require('./initials/torrent.json')
const initialSlack = require('./initials/slack.json')

describe('Slack', () => {
  before(done => {
    (async () => {
      await Product.asyncCreateTable()
      await Bookmark.asyncCreateTable()
      await Subscription.asyncCreateTable()
      await Torrent.asyncCreateTable()
      await Product.asyncCreate(initialProducts[0])
      await Subscription.asyncCreate(initialSubscriptions[0])
      await Torrent.asyncCreate(initialTorrents[0])
      done()
    })()
  })

  describe('ActionEndpoint', () => {
    const wrapped = mochaPlugin.getWrapper('slackActionEndpoint', '/slack.js', 'actionEndpoint')
    it('Regular request (create bookmark) returns status code 200', () => {
      return wrapped.run({body: `payload=${JSON.stringify(initialSlack[0])}`}).then(response => expect(response.statusCode).to.be.equal(200))
    })
    it('Regular request (delete bookmark) returns status code 200', () => {
      return wrapped.run({body: `payload=${JSON.stringify(initialSlack[1])}`}).then(response => expect(response.statusCode).to.be.equal(200))
    })
    it('Regular request (subscription actress) returns status code 200', () => {
      return wrapped.run({body: `payload=${JSON.stringify(initialSlack[2])}`}).then(response => expect(response.statusCode).to.be.equal(200))
    })
    it('Regular request (subscription genre) returns status code 200', () => {
      return wrapped.run({body: `payload=${JSON.stringify(initialSlack[3])}`}).then(response => expect(response.statusCode).to.be.equal(200))
    })
    it('Regular request (subscription delete) returns status code 200', () => {
      Subscription.asyncAll(['id']).then(data => {
        initialSlack[4].actions[0].value = data.Items[0].get('id')
        return wrapped.run({body: `payload=${JSON.stringify(initialSlack[4])}`}).then(response => expect(response.statusCode).to.be.equal(200))
      })
    })
    it('Regular request (torrent download) returns status code 200', () => {
      initialSlack[5].actions[0].value = JSON.stringify({productId: initialTorrents[0].productId, torrentId: initialTorrents[0].torrentId})
      return wrapped.run({body: `payload=${JSON.stringify(initialSlack[5])}`}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('Command', () => {
    const wrapped = mochaPlugin.getWrapper('slackCommand', '/slack.js', 'command')
    it('Regular request (/subscriptions) returns status code 200', () => {
      return wrapped.run({body: 'command=/subscriptions'}).then(response => expect(response.statusCode).to.be.equal(200))
    })
    it('Regular request (/bookmarks) returns status code 200', () => {
      return wrapped.run({body: 'command=/bookmarks'}).then(response => expect(response.statusCode).to.be.equal(200))
    })
    it('Regular request (/actress) returns status code 200', () => {
      return wrapped.run({body: 'command=/actress&text=深田えいみ'}).then(response => {
        expect(response.statusCode).to.be.equal(200)
      })
    })
    it('Regular request (/genre) returns status code 200', () => {
      return wrapped.run({body: 'command=/genre&text=でびゅーさくひん'}).then(response => {
        expect(response.statusCode).to.be.equal(200)
      })
    })
  })

  after(done => {
    (async () => {
      await Product.asyncDeleteTable()
      await Bookmark.asyncDeleteTable()
      await Subscription.asyncDeleteTable()
      await Torrent.asyncDeleteTable()
      done()
    })()
  })
})