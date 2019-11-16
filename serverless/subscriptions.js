'use strict'

const { Subscription } = require('./model/subscription')
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
  const subscriptions = (await Subscription.asyncAll(['id', 'name'])).Items
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
  const subscriptions = await Subscription.asyncAll(['id', 'skipedCount'])
  // dmm apiの仕様上同時アクセスが20以下に設定されているため、余裕のある10に制限する
  const sortedSubscriptions = Array.from(subscriptions).sort((a, b) => {
    if (a.get('skipedCount') > b.get('skipedCount')) return -1
    if (a.get('skipedCount') < b.get('skipedCount')) return 1
    return 0;
  })
  const searchables = sortedSubscriptions.slice(0, 10)
  const nonSearchables = sortedSubscriptions.slice(10)
  await Promise.all(searchables.map(subscription => subscription.invokeSearchProducts()))
  await Promise.all(searchables.map(subsc => Subscription.asyncUpdate({ id: subsc.get('id'), skipedCount: 0 })))
  await Promise.all(nonSearchables.map(subsc => Subscription.asyncUpdate({ id: subsc.get('id'), skipedCount: subsc.get('skipedCount') + 1 })))
  return {statusCode: 200}
}