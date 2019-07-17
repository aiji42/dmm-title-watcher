'use strict'

const qs = require('querystring')
const { Bookmark } = require('./model/bookmark')
const { Product } = require('./model/product')

module.exports.actionEndpoint = (event, context, callback) => {
  const data = JSON.parse(qs.parse(event.body).payload)
  if (data.callback_id == 'bookmark') {
    bookmark(data).then(msg => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(msg)
      })
    })
  } else {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(data.original_message)
    })
  }
}

const bookmark = async (data) => {
  let isBookmarked = false
  if (data.actions[0].name == 'create') {
    await Bookmark.invokeCreate(data.actions[0].value)
    isBookmarked = true
  } else if (data.actions[0].name == 'delete') {
    await Bookmark.invokeDelete(data.actions[0].value)
  }
  const product = await Product.asyncGet(data.actions[0].value)
  return product.slackMessage(isBookmarked)
}