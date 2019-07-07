'use strict'

const { Product } = require('./table-schema')
const { WebClient } = require('@slack/web-api')
const slack = new WebClient(process.env.SLACK_TOKEN)
const channel = process.env.SLACK_CHANNEL_ID

Product.prototype.notifySlack = function() {
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

  const message = {
    channel: channel,
    attachments: [
      {
        fallback: '【新着】条件にマッチする新着タイトルが見つかりました。',
        title: this.title(),
        title_link: this.dmmLink(),
        text: `${this.saleStartDate()}発売`,
        fields: fields,
        image_url: this.imageURL().large,
        actions: [
          {
            type: 'button',
            name: 'bookmark',
            text: 'ブックマーク',
            style: 'danger',
            url: this.bookmarkLink(),
            confirm: {
              title: 'ブックマークしますか?',
              text: '発売日にリマインドされます。',
              ok_text: 'Yes',
              dismiss_text: 'No'
            }
          }
        ]
      }
    ]
  }

  return slack.chat.postMessage(message)
}

Product.prototype.remindNotifySlack = function() {
  const message = {
    channel: channel,
    attachments: [
      {
        fallback: '【リマインド】ブックマークしていたタイトルが発売されました。',
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