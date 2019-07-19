'use strict'

const { Subscription } = require('./model/subscription')
const { Product } = require('./model/product')
const { DMMClient } = require('./util/dmm-client')
const { SlackClient } = require('./util/slack-client')

module.exports.subscribeActress = async (event) => {
  const actress = await DMMClient.findActress(event.id)

  const condition = Subscription.defaultCondition
  condition.article = 'actress'
  condition.article_id = actress.id
  const exceptCondition = Subscription.defaultExceptCondition

  await create({name: `新着 ${actress.name}`, condition: condition, exceptCondition: exceptCondition})
  return {statusCode: 200}
}

module.exports.subscribeGenre = async (event) => {
  const genre = await DMMClient.findGenre(event.keyword)

  const condition = Subscription.defaultCondition
  condition.article = 'genre'
  condition.article_id = genre.genre_id
  const exceptCondition = Subscription.defaultExceptCondition

  await create({name: `新着 ${genre.name}`, condition: condition, exceptCondition: exceptCondition})
  return {statusCode: 200}
}

const create = async (data) => {
  const subscription = await Subscription.asyncCreate(data)
  await SlackClient.post(`購読条件: ${subscription.get('name')}を作製しました。`)
}

module.exports.index = async (event) => {
  const subscriptions = (await Subscription.asyncAll(['id', 'name', 'failedCount'])).Items
  await SlackClient.postSubscriptions(subscriptions)
  return {statusCode: 200}
}

module.exports.delete = async (event) => {
  const subscription = await Subscription.asyncDestroy(event.id, {ReturnValues: 'ALL_OLD'})
  if (! subscription) return {statusCode: 404}
  await SlackClient.post(`購読条件: ${subscription.get('name')}を削除しました。`)
  return {statusCode: 200}
}

module.exports.searchProducts = async (event) => {
  const subscription = await Subscription.asyncGet(event.id)
  if (! subscription) return {statusCode: 404}
  await subscription.searchProductsAndNotify()
  return {statusCode: 200}
}

module.exports.bulkSearchProducts = async (event) => {
  const subscriptions = await Subscription.getActiveItems()
  await Promise.all(subscriptions.map(subscription => subscription.invokeSearchProducts()))
  return {statusCode: 200}
}