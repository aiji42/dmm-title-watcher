'use strict'

const { Torrent } = require('./model/torrent')

module.exports.download = (event, context, callback) => {
  Torrent.asyncGet(event.pathParameters.id, event.pathParameters.torrentId)
  .then(torrent => {
    if (! torrent) throw 'Not Found torrent'
    return torrent.download()
  })
  .then(() => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: `Sucessfully create download`
      })
    })
  })
  .catch(err => {
    console.log(err)
    if (err == 'Not Found product') {
      callback(null, {
        statusCode: 404,
        body: JSON.stringify({
          message: `Not Found torrent productId: ${event.pathParameters.id}, torrentId: ${event.pathParameters.torrentId}`
        })
      })
    } else {
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to download torrent productId: ${event.pathParameters.id}, torrentId: ${event.pathParameters.torrentId}`
        })
      })
    }
  })
}