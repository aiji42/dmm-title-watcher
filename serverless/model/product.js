'use strict'

const { Product } = require('./table-schema')
const { Torrent } = require('./torrent')
const { WebClient } = require('@slack/web-api')
const slack = new WebClient(process.env.SLACK_TOKEN)
const channel = process.env.SLACK_CHANNEL_ID
const { si } = require('nyaapi')

Product.prototype.slackMessage = function(isBookmarked = false) {
  const actresses = this.actresses().map(actress => `<${actressDMMLink(actress)}|${actress.name}>[<${actionsSubscribeLink(actress)}|購読>]`)
  const genres = this.genres().map(genre => genre.name)

  const fields = []
  fields.push({title: 'ジャンル', value: genres.join(' ')})
  for (let i = 0; i < actresses.length; i += 8) {
    const field = {
      title: '出演',
      value: actresses.slice(i, i + 8).join('\n'),
      short:true
    }
    fields.push(field)
  }

  const action = {
    type: 'button',
    name: 'create',
    text: 'ブックマーク',
    value: this.get('id'),
    style: 'primary'
  }

  if (isBookmarked) {
    action.name = 'delete'
    action.text = 'ブックマーク解除'
    action.style = 'danger'
    action.confirm = {
      title: 'ブックマークを解除しますか？',
      text: 'こちらは発売日にリマインドされます。ブックマークを解除しますか？',
      ok_text: 'Yes',
      dismiss_text: 'No'
    }
  }

  return {
    text: '条件にマッチする新着タイトルが見つかりました。',
    attachments: [
      {
        fallback: 'error',
        title: this.title(),
        title_link: this.dmmLink(),
        text: `${this.saleStartDate()}発売`,
        fields: fields,
        image_url: this.imageURL().large,
        callback_id: 'bookmark',
        actions: [ action ]
      }
    ]
  }
}

Product.prototype.notifySlack = function() {
  const message = this.slackMessage()
  message.channel = channel
  message.username = '新着お知らせ'
  message.icon_emoji = ':new:'

  return slack.chat.postMessage(message)
}

Product.prototype.remindNotifySlack = function() {
  const message = {
    channel: channel,
    username: 'リマインダー',
    icon_emoji: ':arrows_counterclockwise:',
    attachments: [
      {
        fallback: 'ブックマークしていたタイトルが発売されました。',
        title: 'リマインド',
        color: 'danger',
        text: [
          `<${this.dmmLink()}|${this.title()}>`,
          `${this.saleStartDate()} タイトルが発売されました。`
        ].join('\n'),
        image_url: this.imageURL().large
      }
    ]
  }

  return slack.chat.postMessage(message)
}

Product.prototype.notifySlackWithTorrent = async function() {
  const torrentInfos = await this.searchTorrent()
  const torrents = await Promise.all(torrentInfos.map(torrentInfo => this.createTorrent(torrentInfo)))
  const message = {
    channel: channel,
    username: 'ダウンロード可能',
    icon_emoji: ':arrows_counterclockwise:',
    attachments: [
      {
        fallback: 'Torrentファイル発見',
        title: this.title(),
        title_link: this.dmmLink(),
        color: 'danger',
        image_url: this.imageURL().large
      },
      ...torrents.map(torrent => {
        return {
          title: torrent.name(),
          text: torrent.digest(),
          color: 'good',
          actions: [
            {
              type: 'button',
              name: 'download',
              text: 'ダウンロード',
              style: 'danger',
              url: torrent.downloadLink()
            }
          ]
        }
      })
    ]
  }

  return await slack.chat.postMessage(message)
}

Product.prototype.searchTorrent = function() {
  const pattern = /([a-zA-Z]{3,4}).*(\d{3})$/
  const query = [
    `${pattern.exec(this.get('id'))[1]} ${pattern.exec(this.get('id'))[2]}`,
    null,             // リミットなし
    {category: '2_2'} // カテゴリ 実写
  ]
  return new Promise((resolve, reject) => {
    si.search(...query)
    .then(results => {
      resolve(results)
    })
    .catch(reject)
  })
}

Product.prototype.createTorrent = function(torrentInfo) {
  const torrentId = /.*\/(\d+)$/.exec(torrentInfo.links.page)[1]
  return Torrent.asyncCreate({productId: this.get('id'), torrentId: torrentId, info: torrentInfo})
}

Product.prototype.title = function() {
  return this.get('info').title
}

Product.prototype.dmmLink = function() {
  return this.get('info').URL
}

Product.prototype.saleStartDate = function() {
  return this.get('info').date.slice(0, 10)
}

Product.prototype.imageURL = function() {
  return this.get('info').imageURL
}

Product.prototype.actresses = function() {
  return this.get('info').iteminfo.actress || []
}

Product.prototype.genres = function() {
  return this.get('info').iteminfo.genre || []
}

Product.prototype.bookmarkLink = function() {
  return `${process.env.GW_URL}/products/${this.get('id')}/bookmarks/create`
}

const actressDMMLink = actress => {
  return `https://www.dmm.co.jp/digital/videoa/-/list/=/article=actress/id=${actress.id}/sort=date/`
}

const actionsSubscribeLink = actress => {
  return `${process.env.GW_URL}/subscriptions/actress/${actress.id}/subscribe`
}

module.exports.Product = Product