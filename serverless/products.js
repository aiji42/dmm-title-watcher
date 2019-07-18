'use strict'

const { Subscription } = require('./model/subscription')
const { Product } = require('./model/product')
const { SlackClient } = require('./util/slack-client')
const unmarshalItem = require('dynamodb-marshaler').unmarshalItem

module.exports.search = async (event) => {
  try {
    const subscription = await Subscription.asyncGet(event.id)
    const products = await subscription.getProductsByAPI()
    await Promise.all(products.map(product => Product.asyncCreate({id: product.get('id'), info: product.get('info')})))
    return {statusCode: 200, body: 'Sucessfully search products'}
  } catch (err) {
    return {statusCode: 500, body: err.message}
  }
}

module.exports.searchAll = async (event) => {
  const subscriptions = await Subscription.getActiveItems()
  await Promise.all(subscriptions.map(subscription => subscription.invokeProductsSearch()))
  return {statusCode: 200, body: 'Sucessfully search by all subscriptions'}
}

module.exports.notify = async (event) => {
  const records = event.Records.filter(record => record.eventName == 'INSERT')
  const products = records.map(record => new Product(unmarshalItem(record.dynamodb.NewImage)))
  await Promise.all(products.map(product => SlackClient.postProduct('新着タイトルが見つかりました。', product)))
  return {statusCode: 200, body: 'Sucessfully product notify slack'}
}

module.exports.remindNotify = async (event) => {
  const product = await Product.asyncGet(event.productId)
  if (event.slack) await SlackClient.postProduct('【リマインド】本日発売日です。', product)
  return {statusCode: 200, body: 'Sucessfully product remind notify'}
}

module.exports.searchTorrentAndNotify = async (event) => {
  try {
    const product = await Product.asyncGet(event.productId)
    const torrentInfos = await product.searchTorrent()
    if (torrentInfos.length > 0) {
      const torrents = await Promise.all(torrentInfos.map(torrentInfo => product.createTorrent(torrentInfo)))
      if (event.slack) await SlackClient.postTorrents(product, torrents)
    }
    return {statusCode: 200, body: 'Sucessfully product search torrent and notify'}
  } catch (err) {
    return {statusCode: 500, body: err.message}
  }
}