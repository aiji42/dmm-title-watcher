'use strict'

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const initialProducts = require('./initials/product.json')
const { Product } = require('../model/product')
const { Bookmark } = require('../model/bookmark')

describe('Bookmarks', () => {
  const initialProduct = initialProducts[0]

  before(done => {
    Product.asyncCreate(initialProduct).then(() => done())
  })

  describe('Create', () => {
    const wrapped = mochaPlugin.getWrapper('bookmarksCreate', '/bookmarks.js', 'create')
    it('Not found returns status code 404', () => {
      return wrapped.run({pathParameters: {id: 'hogehoge'}}).then(response => expect(response.statusCode).to.be.equal(404))
    })

    it('Regular request returns status code 200', () => {
      return wrapped.run({pathParameters: {id: initialProduct.id}}).then(response => expect(response.statusCode).to.be.equal(200))
    })

    it('Created Bookmark', () => {
      return Bookmark.asyncGet(initialProduct.id).then(bookmark => expect(bookmark.get('productId')).to.be.equal(initialProduct.id))
    })
  })

  describe('Remind', () => {
    const wrapped = mochaPlugin.getWrapper('bookmarksRemind', '/bookmarks.js', 'remind')
    it('Succeed remind', () => {
      return wrapped.run({}).then(response => expect(response).to.be.equal('Sucessfully reminded bookmark'))
    })
  })

  describe('Delete', () => {
    const wrapped = mochaPlugin.getWrapper('bookmarksDelete', '/bookmarks.js', 'delete')
    it('Not found bookmark returns status code 404', () => {
      return wrapped.run({pathParameters: {id: '0'}}).then(response => expect(response.statusCode).to.be.equal(404))
    })

    it('Regular request returns status code 200', () => {
      return wrapped.run({pathParameters: {id: initialProduct.id}}).then(response => expect(response.statusCode).to.be.equal(200))
    })

    it('Deleted Bookmark', () => {
      return Bookmark.asyncGet(initialProduct.id).then(bookmark => expect(bookmark).to.be.not.null)
    })
  })

  after(done => {
    Promise.all([Bookmark.asyncTrancate(), Product.asyncTrancate()])
    .then(() => done())
  })
})