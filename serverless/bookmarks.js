'use strict'

const { Product } = require('./model/product')
const { Bookmark } = require('./model/bookmark')
const { SlackClient } = require('./util/slack-client')

module.exports.create = async (event) => {
  try {
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
  } catch (err) {
    console.log('[ERROR] ', err)
    return {statusCode: 500, body: err.message}
  }
}

module.exports.delete = async (event) => {
  try {
    const bookmark = await Bookmark.asyncDestroy(event.pathParameters.id, {ReturnValues: 'ALL_OLD'})
    if (! bookmark) return {statusCode: 404, body: `Not found bookmark id: ${event.pathParameters.id}`}

    if (event.slack) {
      const product = await Product.get(bookmark.get('productId'))
      if (event.responseURL) await SlackClient.replaceProduct(event.responseURL, 'ブックマークを解除しました。', product)
      else await SlackClient.postProduct('ブックマークを解除しました。', product)
    }

    return {statusCode: 200, body: `Sucessfully deleted bookmark id: ${event.pathParameters.id}`}
  } catch (err) {
    console.log('[ERROR] ', err)
    return {statusCode: 500, body: err.message}
  }
}

module.exports.remind = async (event) => {
  try {
    const bookmarks = (await Bookmark.scanRemindable()).Items
    const notify = async (bmk) => {
      const product = await Product.asyncGet(bmk.get('productId'))
      return SlackClient.postProduct('【リマインド】本日発売日です。', product)
    }
    await Promise.all(bookmarks.map(bookmark => notify(bookmark)))
    return {statusCode: 200, body: 'Sucessfully bookmark remind'}
  } catch (err) {
    console.log('[ERROR] ', err)
    return {statusCode: 500, body: err.message}
  }
}

module.exports.searchAllTorrentable = async (event) => {
  try {
    const bookmarks = (await Bookmark.scanTorrentable()).Items
    await Promise.all(bookmarks.map(bookmark => bookmark.invokeSearchTorrentAndNotify({slack: true})))
    return {statusCode: 200}
  } catch (err) {
    console.log('[ERROR] ', err)
    return {statusCode: 500, body: err.message}
  }
}

module.exports.searchTorrentAndNotify = async (event) => {
  try {
    const bookmark = await Bookmark.asyncGet(event.productId)
    const torrentInfos = await bookmark.searchTorrent()
    if (torrentInfos.length > 0) {
      const torrents = await Promise.all(torrentInfos.map(torrentInfo => bookmark.createTorrent(torrentInfo)))
      const product = await Product.asyncGet(bookmark.get('productId'))
      await SlackClient.postProductWithTorrents(product, torrents)
    }
    return {statusCode: 200, body: 'Sucessfully product search torrent and notify'}
  } catch (err) {
    console.log('[ERROR] ', err)
    return {statusCode: 500, body: err.message}
  }
}