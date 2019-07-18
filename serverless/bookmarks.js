'use strict'

const { Product } = require('./model/product')
const { Bookmark } = require('./model/bookmark')
const { SlackClient } = require('./util/slack-client')

module.exports.create = async (event) => {
  const product = await Product.asyncGet(event.pathParameters.id)
  if (! product) return {statusCode: 404, body: 'Not found product'}
  await Bookmark.asyncCreate({
    productId: product.get('id'),
    saleStartDate: product.get('info').date,
    productInfo: product.get('info')
  })

  if (event.slack) {
    if (event.responseURL) await SlackClient.replaceProduct(event.responseURL, 'ブックマークしました。', product)
    else await SlackClient.postProduct('ブックマークしました。', product)
  }

  return {statusCode: 200, body: `Successfully create bookmark productId: ${event.pathParameters.id}`}
}

module.exports.delete = async (event) => {
  const bookmark = await Bookmark.asyncDestroy(event.pathParameters.id, {ReturnValues: 'ALL_OLD'})
  if (! bookmark) return {statusCode: 404, body: `Not found bookmark id: ${event.pathParameters.id}`}

  if (event.slack) {
    const product = await Product.get(bookmark.get('productId'))
    if (event.responseURL) await SlackClient.replaceProduct(event.responseURL, 'ブックマークを解除しました。', product)
    else await SlackClient.postProduct('ブックマークを解除しました。', product)
  }

  return {statusCode: 200, body: `Sucessfully deleted bookmark id: ${event.pathParameters.id}`}
}

module.exports.remind = async (event) => {
  const bookmarks = (await Bookmark.scanRemindable()).Items
  await Promise.all(bookmarks.map(bookmark => bookmark.invokeRemindNotify({slack: true})))
  return {statusCode: 200}
}

module.exports.searchAllTorrentable = async (event) => {
  const bookmarks = (await Bookmark.scanTorrentable()).Items
  await Promise.all(bookmarks.map(bookmark => bookmark.invokeSearchTorrentAndNotify({slack: true})))
  return {statusCode: 200}
}