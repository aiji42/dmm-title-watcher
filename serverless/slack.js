'use strict'

const qs = require('querystring')
const { Bookmark } = require('./model/bookmark')
const { Subscription } = require('./model/subscription')
const { DMMClient } = require('./util/dmm-client')
const { SlackClient } = require('./util/slack-client')

module.exports.actionEndpoint = async (event, context, callback) => {
  callback(null, {statusCode: 200})
  const data = JSON.parse(qs.parse(event.body).payload)
  if (data.callback_id == 'bookmark') {
    if (data.actions[0].name == 'create') await Bookmark.invokeCreate(data.actions[0].value, {slack: true, responseURL: data.response_url})
    if (data.actions[0].name == 'delete') await Bookmark.invokeDelete(data.actions[0].value, {slack: true, responseURL: data.response_url})
  }
  if (data.callback_id == 'subscription') {
    if (data.actions[0].name == 'actress') await Subscription.invokeSubscribeActress(data.actions[0].value, {slack: true})
    if (data.actions[0].name == 'delete')  await Subscription.invokeDelete(data.actions[0].value, {slack: true})
  }
  return {statusCode: 200}
}

module.exports.command = async (event, context, callback) => {
  callback(null, {statusCode: 200})
  const command = qs.parse(event.body).command
  const text = qs.parse(event.body).text
  if (command == '/subscriptions') await Subscription.invokeIndex({slack: true})
  if (command == '/actress')       await actress(text)
  return {statusCode: 200}
}

const actress = async (text) => {
  const actresses = (await DMMClient.asyncActress({keyword: text})).result.actress
  await SlackClient.postActresses(text, actresses)
}