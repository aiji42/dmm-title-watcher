'use strict'

const { Product } = require('./table-schema')
const { Bookmark } = require('./bookmark')

Product.prototype.isBookmarked = async function() {
  const bookmark = await Bookmark.asyncGet(this.get('id'))
  return bookmark ? true : false
}

Product.createOnlyNew = async function(productData) {
  try {
    return await this.asyncCreate(productData, {overwrite: false})
  } catch (err) {
    if (err.code != 'ConditionalCheckFailedException') throw err
  }
}

Product.prototype.title = function() {
  return this.get('info').title
}

Product.prototype.dmmLink = function() {
  return this.get('info').URL
}

Product.prototype.saleStartDate = function() {
  return this.get('info').date.slice(0, 10)
}

Product.prototype.imageURL = function() {
  return this.get('info').imageURL
}

Product.prototype.actresses = function() {
  return this.get('info').iteminfo.actress || []
}

Product.prototype.genres = function() {
  return this.get('info').iteminfo.genre || []
}

module.exports.Product = Product