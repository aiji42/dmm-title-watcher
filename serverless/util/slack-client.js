const { WebClient } = require('@slack/web-api')
const slack = new WebClient(process.env.SLACK_TOKEN)
const channel = process.env.SLACK_CHANNEL_ID

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

const makeAttachmentGenre = (genre) => {
  return {
    title: genre.name,
    title_link: genreDMMLink(genre),
    callback_id: 'subscription',
    actions: [
      {
        type: 'button',
        name: 'genre',
        text: '購読する',
        value: genre.ruby,
        style: 'primary',
        confirm: {
          title: '購読しますか？',
          text: genre.name,
          ok_text: 'Yes',
          dismiss_text: 'No'
        }
      }
    ]
  }
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

  return {
    fallback: 'error',
    title: product.title(),
    title_link: product.dmmLink(),
    text: `${product.saleStartDate()}発売`,
    fields: fields,
    image_url: product.imageURL().large,
    callback_id: 'bookmark',
    actions: [ action ]
  }
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

const post = async (text) => {
  await slack.chat.postMessage({
    channel: channel,
    text: text
  })
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

const postGenres = async (keyword, genres) => {
  await slack.chat.postMessage({
    channel: channel,
    text: `"${keyword}" が見つかりました。`,
    attachments: genres.map(genre => makeAttachmentGenre(genre))
  })
}

const postProduct = async (text, product) => {
  const attachment = await makeAttachmentProduct(product)
  await slack.chat.postMessage({
    channel: channel,
    text: text,
    attachments: [attachment]
  })
}

const postSubscriptionSearchProducts = async (subscription, products) => {
  const attachments = [await makeAttachmentSubscription(subscription)]
  const productAtts = await Promise.all(products.map(product => makeAttachmentProduct(product)))
  await slack.chat.postMessage({
    channel: channel,
    text: `下記購読条件で ${products.length} 件のタイトルが新たに見つかりました。`,
    attachments: attachments.concat(productAtts)
  })
}

const postProductWithTorrents = async (product, torrents) => {
  const attachments = [await makeAttachmentProduct(product)]
  torrents.forEach(torrent => attachments.push(makeAttachmentTorrent(torrent)))
  await slack.chat.postMessage({
    channel: channel,
    text: 'Torrentファイル発見',
    attachments: attachments
  })
}

const actressDMMLink = actress => {
  return `https://www.dmm.co.jp/digital/videoa/-/list/=/article=actress/id=${actress.id}/sort=date/`
}

const genreDMMLink = genre => {
  return `https://www.dmm.co.jp/digital/videoa/-/list/=/article=keyword/id=${genre.genre_id}/sort=date/`
}

module.exports.SlackClient = {
  post: post,
  postSubscriptions: postSubscriptions,
  postActresses: postActresses,
  postGenres: postGenres,
  postProduct: postProduct,
  postProductWithTorrents: postProductWithTorrents,
  postSubscriptionSearchProducts: postSubscriptionSearchProducts
}