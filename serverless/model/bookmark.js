'use strict'

const AWS = require('aws-sdk')
const { Bookmark } = require('./table-schema')
const { Torrent } = require('./torrent')
const { si } = require('nyaapi')

const lambdaConfig = {}
if (process.env.STAGE != 'prod') lambdaConfig.endpoint = process.env.GW_URL
const lambda = new AWS.Lambda(lambdaConfig)

Bookmark.scanRemindable = function() {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, today.getHours(), today.getMinutes(), today.getSeconds())
  return new Promise((resolve, reject) => {
    Bookmark.scan()
      .where('saleStartDate').between(yesterday, today)
      .exec((err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
  })
}

Bookmark.scanTorrentable = function() {
  const today = new Date()
  return new Promise((resolve, reject) => {
    Bookmark.scan()
      .where('saleStartDate').lt(today)
      .exec((err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
  })
}

Bookmark.prototype.searchTorrent = function() {
  const pattern = /([a-zA-Z]{3,4}).*(\d{3})$/
  const term = `${pattern.exec(this.get('productId'))[1]} ${pattern.exec(this.get('productId'))[2]}`
  return si.search(term, null, {category: '2_2'})
}

Bookmark.prototype.createTorrent = function(torrentInfo) {
  const torrentId = /.*\/(\d+)$/.exec(torrentInfo.links.page)[1]
  return Torrent.asyncCreate({productId: this.get('productId'), torrentId: torrentId, info: torrentInfo})
}

Bookmark.invokeCreate = function(productId) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_BOOKMARKS_CREATE,
    InvocationType: 'Event',
    Payload: JSON.stringify({id: productId})
  }).promise()
}

Bookmark.invokeDelete = function(productId) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_BOOKMARKS_DELETE,
    InvocationType: 'Event',
    Payload: JSON.stringify({id: productId})
  }).promise()
}

Bookmark.prototype.invokeDelete = function(options = {}) {
  return Bookmark.invokeDelete(this.get('productId'))
}

Bookmark.prototype.invokeSearchTorrentAndNotify = function() {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_BOOKMARKS_SEARCH_TORRENT_AND_NOTIFY,
    InvocationType: 'Event',
    Payload: JSON.stringify({id: this.get('productId')})
  }).promise()
}

module.exports.Bookmark = Bookmark