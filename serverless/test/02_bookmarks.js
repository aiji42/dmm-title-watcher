'use strict'

process.on('unhandledRejection', console.dir);

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const initialProducts = require('./initials/product.json')
const { Product } = require('../model/product')
const { Bookmark } = require('../model/bookmark')
const { Torrent } = require('../model/torrent')

describe('Bookmarks', () => {
  const initialProduct = initialProducts[0]

  before(done => {
    (async () => {
      await Bookmark.asyncCreateTable()
      await Product.asyncCreateTable()
      await Torrent.asyncCreateTable()
      await Product.asyncCreate(initialProduct)
      done()
    })()
  })

  describe('Create', () => {
    const wrapped = mochaPlugin.getWrapper('bookmarksCreate', '/bookmarks.js', 'create')
    it('Not found returns status code 404', () => {
      return wrapped.run({id: 'hogehoge'}).then(response => expect(response.statusCode).to.be.equal(404))
    })

    it('Regular request returns status code 200', () => {
      return wrapped.run({id: initialProduct.id}).then(response => expect(response.statusCode).to.be.equal(200))
    })

    it('Created Bookmark', () => {
      return Bookmark.asyncGet(initialProduct.id).then(bookmark => expect(bookmark.get('productId')).to.be.equal(initialProduct.id))
    })
  })

  describe('Index', () => {
    const wrapped = mochaPlugin.getWrapper('bookmarksIndex', '/bookmarks.js', 'index')
    it('Regular request returns status code 200', () => {
      return wrapped.run({}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('Remind', () => {
    const wrapped = mochaPlugin.getWrapper('bookmarksRemind', '/bookmarks.js', 'remind')
    it('Succeed remind', () => {
      return wrapped.run({}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('SearchAllTorrentable', () => {
    const wrapped = mochaPlugin.getWrapper('bookmarksSearchAllTorrentable', '/bookmarks.js', 'searchAllTorrentable')
    it('Succeed search all torrentable', () => {
      return wrapped.run({}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('SearchTorrentAndNotify', () => {
    const wrapped = mochaPlugin.getWrapper('bookmarksSearchTorrentAndNotify', '/bookmarks.js', 'searchTorrentAndNotify')
    it('Regular request succeed', () => {
      return wrapped.run({id: initialProduct.id}).then(response => expect(response.statusCode).to.be.equal(200))
    })
  })

  describe('Delete', () => {
    const wrapped = mochaPlugin.getWrapper('bookmarksDelete', '/bookmarks.js', 'delete')
    it('Not found bookmark returns status code 404', () => {
      return wrapped.run({id: '0'}).then(response => expect(response.statusCode).to.be.equal(404))
    })

    it('Regular request returns status code 200', () => {
      return wrapped.run({id: initialProduct.id}).then(response => expect(response.statusCode).to.be.equal(200))
    })

    it('Deleted Bookmark', () => {
      return Bookmark.asyncGet(initialProduct.id).then(bookmark => expect(bookmark).to.be.null)
    })
  })

  after(done => {
    (async () => {
      await Bookmark.asyncDeleteTable()
      await Torrent.asyncDeleteTable()
      await Product.asyncDeleteTable()
      done()
    })()
  })
})