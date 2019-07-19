'use strict'

const { Product } = require('./table-schema')
const { Torrent } = require('./torrent')
const { Bookmark } = require('./bookmark')
const { SlackClient } = require('../util/slack-client')
const { si } = require('nyaapi')

Product.prototype.isBookmarked = async function() {
  const bookmark = await Bookmark.asyncGet(this.get('id'))
  return bookmark ? true : false
}

Product.prototype.searchTorrent = function() {
  const pattern = /([a-zA-Z]{3,4}).*(\d{3})$/
  const term = `${pattern.exec(this.get('id'))[1]} ${pattern.exec(this.get('id'))[2]}`
  return si.search(term, null, {category: '2_2'})
}

Product.asyncCreateAndNotifyIfNew = async function(productData) {
  try {
    const product = await this.asyncCreate(productData, {overwrite: false})
    await SlackClient.postProduct('新着タイトルが見つかりました。', product)
  } catch (err) {
    if (err.code != 'ConditionalCheckFailedException') throw err
  }
}

Product.prototype.createTorrent = function(torrentInfo) {
  const torrentId = /.*\/(\d+)$/.exec(torrentInfo.links.page)[1]
  return Torrent.asyncCreate({productId: this.get('id'), torrentId: torrentId, info: torrentInfo})
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

Product.prototype.bookmarkLink = function() {
  return `${process.env.GW_URL}/products/${this.get('id')}/bookmarks/create`
}

module.exports.Product = Product