'use strict'

const AWS = require('aws-sdk')
const { Torrent } = require('./table-schema')
const request = require('request')
const lambdaConfig = {}
if (process.env.STAGE != 'prod') lambdaConfig.endpoint = process.env.GW_URL
const lambda = new AWS.Lambda(lambdaConfig)
const s3Config = { s3ForcePathStyle: true }
if (process.env.STAGE != 'prod') s3Config.endpoint = 'http://s3:9000'
const s3 = new AWS.S3(s3Config)

Torrent.prototype.digest = function() {
  const date = new Date(this.get('info').timestamp * 1000)
  const y = date.getFullYear()
  const m = ("00" + (date.getMonth()+1)).slice(-2)
  const d = ("00" + date.getDate()).slice(-2)
  return [
    `${y}-${m}-${d}`,
    this.get('info').fileSize,
    `S:${this.get('info').seeders}`,
    `L:${this.get('info').leechers}`,
    `D:${this.get('info').nbDownload}`,
  ].join('|')
}

Torrent.prototype.download = function() {
  return new Promise((resolve, reject) => {
    request.get(this.get('info').links.file, (err, response, body) => {
      if (err) {
        reject(err)
      } else {
        const params = {
          Bucket: process.env.BUCKET_TRANSMISSION_PROJECT,
          Key: this.keyOnS3Bucket(),
          Body: body
        }
        s3.putObject(params, (err) => {
          if (err) {
            reject(err)
          } else {
            Torrent.asyncUpdate({productId: this.get('productId'), torrentId: this.get('torrentId'), status: 'running'})
            .then(torrent => resolve(torrent))
          }
        })
      }
    })
  })
}

Torrent.prototype.fileName = function() {
  return `${this.get('torrentId')}.torrent`
}

Torrent.prototype.keyOnS3Bucket = function() {
  return this.get('status') == 'pending' ? `watch/${this.fileName()}` : `added/${this.fileName()}`
}

Torrent.prototype.name = function() {
  return this.get('info').name
}

Torrent.invokeDownload = function(productId, torrentId) {
  return lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_TORRENTS_DOWNLOAD,
    InvocationType: 'Event',
    Payload: JSON.stringify({productId: productId, torrentId: torrentId})
  }).promise()
}

module.exports.Torrent = Torrent