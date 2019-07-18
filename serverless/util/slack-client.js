const { WebClient } = require('@slack/web-api')
const slack = new WebClient(process.env.SLACK_TOKEN)
const channel = process.env.SLACK_CHANNEL_ID
const request = require('request')

const post = async (text) => {
  await slack.chat.postMessage({
    channel: channel,
    text: text
  })
}

const replacePost = async (responseURL, message) => {
  const options = {
    uri: responseURL,
    headers: {'Content-type': 'application/json'},
    json: message
  }
  return new Promise((resolve, reject) => {
    request.post(options, (err, response, body) => {
      if (err) reject(err)
      else resolve(body)
    })
  })
}

const makeAttachmentSubscription = (subscription) => {
  return {
    title: subscription.get('name'),
    callback_id: 'subscription',
    actions: [
      {
        type: 'button',
        name: 'delete',
        text: '解除する',
        value: subscription.get('id'),
        style: 'danger',
        confirm: {
          title: '購読を解除しますか？',
          ok_text: 'Yes',
          dismiss_text: 'No'
        }
      }
    ]
  }
}

const makeAttachmentActress = (actress) => {
  const attachment = {
    title: actress.name,
    title_link: actressDMMLink(actress),
    callback_id: 'subscription',
    actions: [
      {
        type: 'button',
        name: 'actress',
        text: '購読する',
        value: actress.id,
        style: 'primary',
        confirm: {
          title: '購読しますか？',
          text: actress.name,
          ok_text: 'Yes',
          dismiss_text: 'No'
        }
      }
    ]
  }
  if ('imageURL' in actress) attachment.thumb_url = actress.imageURL.large
  return attachment
}

const makeAttachmentProduct = async (product) => {
  const actresses = product.actresses().map(actress => `<${actressDMMLink(actress)}|${actress.name}>`)
  const genres = product.genres().map(genre => genre.name)
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
    value: product.get('id'),
    style: 'primary'
  }
  const isBookmarked = await product.isBookmarked()
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

  return [
    {
      fallback: 'error',
      title: product.title(),
      title_link: product.dmmLink(),
      text: `${product.saleStartDate()}発売`,
      fields: fields,
      image_url: product.imageURL().large,
      callback_id: 'bookmark',
      actions: [ action ]
    }
  ]
}

const makeAttachmentTorrent = torrent => {
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
}

const postSubscriptions = async (subscriptions) => {
  await slack.chat.postMessage({
    channel: channel,
    text: '購読条件一覧',
    attachments: subscriptions.map(subscription => makeAttachmentSubscription(subscription))
  })
}

const postActresses = async (keyword, actresses) => {
  await slack.chat.postMessage({
    channel: channel,
    text: `"${keyword}" で ${actresses.length}人の女優がみつかりました。`,
    attachments: actresses.map(actress => makeAttachmentActress(actress))
  })
}

const postProduct = async (text, product) => {
  const attachments = await makeAttachmentProduct(product)
  await slack.chat.postMessage({
    channel: channel,
    text: text,
    attachments: attachments
  })
}

const replaceProduct = async (responseURL, text, product) => {
  const attachments = await makeAttachmentProduct(product)
  await replacePost(responseURL, {
    text: text,
    attachments: attachments
  })
}

const postProductWithTorrents = async (product, torrents) => {
  const attachments = await makeAttachmentProduct(product)
  attachments.push(torrents.map(torrent => makeAttachmentTorrent(torrent)))
  await slack.chat.postMessage({
    channel: channel,
    text: 'Torrentファイル発見',
    attachments: attachments
  })
}

const actressDMMLink = actress => {
  return `https://www.dmm.co.jp/digital/videoa/-/list/=/article=actress/id=${actress.id}/sort=date/`
}

module.exports.SlackClient = {
  post: post,
  postSubscriptions: postSubscriptions,
  postActresses: postActresses,
  postProduct: postProduct,
  replaceProduct: replaceProduct,
  postProductWithTorrents: postProductWithTorrents
}