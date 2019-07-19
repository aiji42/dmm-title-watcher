'use strict'

const { Subscription } = require('./model/subscription')
const { Product } = require('./model/product')
const { SlackClient } = require('./util/slack-client')

module.exports.search = async (event) => {
  try {
    const subscription = await Subscription.asyncGet(event.id)
    const products = await subscription.getProductsByAPI()
    await Promise.all(products.map(product => Product.asyncCreateAndNotifyIfNew({id: product.get('id'), info: product.get('info')})))
    return {statusCode: 200, body: 'Sucessfully search products'}
  } catch (err) {
    console.log('[ERROR] ', err)
    return {statusCode: 500, body: err.message}
  }
}

module.exports.searchAll = async (event) => {
  try {
    const subscriptions = await Subscription.getActiveItems()
    await Promise.all(subscriptions.map(subscription => subscription.invokeProductsSearch()))
    return {statusCode: 200, body: 'Sucessfully search by all subscriptions'}
  } catch (err) {
    console.log('[ERROR] ', err)
    return {statusCode: 500, body: err.message}
  }
}

module.exports.remindNotify = async (event) => {
  try {
    const product = await Product.asyncGet(event.productId)
    if (event.slack) await SlackClient.postProduct('【リマインド】本日発売日です。', product)
    return {statusCode: 200, body: 'Sucessfully product remind notify'}
  } catch (err) {
    console.log('[ERROR] ', err)
    return {statusCode: 500, body: err.message}
  }
}

module.exports.searchTorrentAndNotify = async (event) => {
  try {
    const product = await Product.asyncGet(event.productId)
    const torrentInfos = await product.searchTorrent()
    if (torrentInfos.length > 0) {
      const torrents = await Promise.all(torrentInfos.map(torrentInfo => product.createTorrent(torrentInfo)))
      if (event.slack) await SlackClient.postProductWithTorrents(product, torrents)
    }
    return {statusCode: 200, body: 'Sucessfully product search torrent and notify'}
  } catch (err) {
    console.log('[ERROR] ', err)
    return {statusCode: 500, body: err.message}
  }
}