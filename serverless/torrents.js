'use strict'

const { Torrent } = require('./model/torrent')
const { SlackClient } = require('./util/slack-client')

module.exports.download = async (event) => {
  const torrent = await Torrent.asyncGet(event.productId, event.torrentId)
  if (! torrent) return {statusCode: 404}
  await torrent.download()
  await SlackClient.post(`Torrentファイル: ${torrent.name()} をダウンロード開始しました。`)
  return {statusCode: 200}
}