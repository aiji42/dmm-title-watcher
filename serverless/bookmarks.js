'use strict'

const { Product } = require('./model/product')
const { Bookmark } = require('./model/bookmark')
const { SlackClient } = require('./util/slack-client')

module.exports.create = async (event) => {
  const product = await Product.asyncGet(event.id)
  if (! product) return {statusCode: 404}
  await Bookmark.asyncCreate({
    productId: product.get('id'),
    saleStartDate: product.get('info').date,
    productInfo: product.get('info')
  })
  await SlackClient.postProduct('ブックマークしました。', product)
  return {statusCode: 200}
}

module.exports.delete = async (event) => {
  const bookmark = await Bookmark.asyncDestroy(event.id, {ReturnValues: 'ALL_OLD'})
  if (! bookmark) return {statusCode: 404}
  const product = await Product.asyncGet(bookmark.get('productId'))
  await SlackClient.postProduct('ブックマークを解除しました。', product)
  return {statusCode: 200}
}

module.exports.index = async (event) => {
  const bookmarks = (await Bookmark.asyncAll(['productId', 'productInfo', 'saleStartDate'])).Items
  await SlackClient.postBookmarks(bookmarks)
  return {statusCode: 200}
}

module.exports.remind = async (event) => {
  const bookmarks = (await Bookmark.scanRemindable()).Items
  const products = await Product.asyncGetItems(bookmarks.map(bookmark => bookmark.get('productId')))
  await Promise.all(products.map(product => SlackClient.postProduct('【リマインド】本日発売日です。', product)))
  return {statusCode: 200}
}

module.exports.searchAllTorrentable = async (event) => {
  const bookmarks = (await Bookmark.scanTorrentable()).Items
  await Promise.all(bookmarks.map(bookmark => bookmark.invokeSearchTorrentAndNotify()))
  return {statusCode: 200}
}

module.exports.searchTorrentAndNotify = async (event) => {
  const bookmark = await Bookmark.asyncGet(event.id)
  const torrentInfos = await bookmark.searchTorrent()
  if (torrentInfos.length < 1) return {statusCode: 200}
  const torrents = await Promise.all(torrentInfos.map(torrentInfo => bookmark.createTorrent(torrentInfo)))
  const product = await Product.asyncGet(bookmark.get('productId'))
  await SlackClient.postProductWithTorrents(product, torrents)
  return {statusCode: 200}
}