'use strict'

const qs = require('querystring')
const { Bookmark } = require('./model/bookmark')
const { Subscription } = require('./model/subscription')
const { DMMClient } = require('./util/dmm-client')
const { SlackClient } = require('./util/slack-client')

module.exports.actionEndpoint = async (event, context, callback) => {
  callback(null, {statusCode: 200})
  const data = JSON.parse(qs.parse(event.body).payload)
  const name = data.actions[0].name
  const value = data.actions[0].value
  if (data.callback_id == 'bookmark') {
    if (name == 'create') await Bookmark.invokeCreate(value)
    if (name == 'delete') await Bookmark.invokeDelete(value)
  }
  if (data.callback_id == 'subscription') {
    if (name == 'actress') await Subscription.invokeSubscribeActress(value)
    if (name == 'genre')   await Subscription.invokeSubscribeGenre(value)
    if (name == 'delete')  await Subscription.invokeDelete(value)
  }
  return {statusCode: 200}
}

module.exports.command = async (event, context, callback) => {
  callback(null, {statusCode: 200})
  const command = qs.parse(event.body).command
  const text = qs.parse(event.body).text
  if (command == '/subscriptions') await Subscription.invokeIndex()
  if (command == '/actress')       await actress(text)
  if (command == '/genre')         await genre(text)
  return {statusCode: 200}
}

const actress = async (text) => {
  const actresses = (await DMMClient.asyncActress({keyword: text})).result.actress
  await SlackClient.postActresses(text, actresses)
}

const genre = async (text) => {
  try {
    const genre = await DMMClient.findGenre(text)
    await SlackClient.postGenres(text, [genre])
  } catch (err) {
    if (err.message == 'Not Found genre') await SlackClient.post(`"${text}"" は見つかりませんでした。`)
  }
}