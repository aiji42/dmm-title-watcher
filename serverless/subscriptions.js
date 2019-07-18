'use strict'

const { Subscription } = require('./model/subscription')
const { DMMClient } = require('./util/dmm-client')
const { SlackClient } = require('./util/slack-client')

module.exports.create = async (event) => {
  const requestBody = JSON.parse(event.body)
  const name = requestBody.name
  const condition = requestBody.condition
  const exceptCondition = requestBody.exceptCondition || {}
  if (typeof name !== 'string' || typeof condition !== 'object' || typeof exceptCondition !== 'object') {
    return {statusCode: 400, body: 'Unable to create subscription validation error'}
  }

  const subscription = await Subscription.asyncCreate({name: name, condition: condition, exceptCondition: exceptCondition})

  if (event.slack) await SlackClient.post(`購読条件: ${subscription.get('name')}を作製しました。`)

  subscription.invokeProductsSearch({slack: event.slack})

  return {statusCode: 200, body: `Sucessfully created subscription '${subscription.get('name')}'`}
}

module.exports.subscribeActress = async (event) => {
  const condition = {
    site: "FANZA",
    service: "digital",
    floor: "videoa",
    article: "actress",
    article_id: Number(event.pathParameters.id),
    gte_date: "#TODAY",
    hits: 100
  }
  const exceptCondition = {
    genre: [3036, 6793]
  }

  const actress = await DMMClient.findActress(event.pathParameters.id)
  await Subscription.invokeCreate({name: `新着 ${actress.name}`, condition: condition, exceptCondition: exceptCondition}, {slack: event.slack})

  return {statusCode: 200}
}

module.exports.index = async (event) => {
  const subscriptions = (await Subscription.asyncAll(['id', 'name'])).Items

  if (event.slack) await SlackClient.postSubscriptions(subscriptions)

  return {statusCode: 200, body: JSON.stringify(subscriptions)}
}

module.exports.show = async (event) => {
  const subscription = await Subscription.asyncGet(event.pathParameters.id)
  if (! subscription) return {statusCode: 404, body: `Not found subscription id: ${event.pathParameters.id}`}

  // slack に通知する機能

  return {statusCode: 200, body: JSON.stringify(subscription.attrs)}
}

module.exports.delete = async (event) => {
  const subscription = await Subscription.asyncDestroy(event.pathParameters.id, {ReturnValues: 'ALL_OLD'})
  if (! subscription) return {statusCode: 404, body: `Not found subscription id: ${event.pathParameters.id}`}

  if (event.slack) await SlackClient.post(`購読条件: ${subscription.get('name')}を削除しました。`)

  return {statusCode: 200, body: `Sucessfully deleted subscription id: ${event.pathParameters.id}`}
}