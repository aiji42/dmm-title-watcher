'use strict'

const { Torrent } = require('./model/torrent')

module.exports.download = async (event) => {
  try {
    const torrent = await Torrent.asyncGet(event.pathParameters.id, event.pathParameters.torrentId)
    if (! torrent) return {statusCode: 404, body: `Not Found torrent productId: ${event.pathParameters.id}, torrentId: ${event.pathParameters.torrentId}`}
    await torrent.download()
    return {statusCode: 200, body: 'Sucessfully create download'}
  } catch (err) {
    console.log('[ERROR] ', err)
    return {statusCode: 500, body: err.message}
  }
}