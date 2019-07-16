'use strict'

const { Subscription } = require('./model/subscription')
const { DMMClient } = require('./util/dmm-client')

module.exports.create = (event, context, callback) => {
  const requestBody = JSON.parse(event.body)
  const name = requestBody.name
  const condition = requestBody.condition
  const exceptCondition = requestBody.exceptCondition || {}
  if (typeof name !== 'string' || typeof condition !== 'object' || typeof exceptCondition !== 'object') {
    callback(null, {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Unable to create subscription validation error'
      })
    })
    return
  }
  // TODO: ある程度のバリデーションは必要

  Subscription.asyncCreate({name: name, condition: condition, exceptCondition: exceptCondition})
  .then((subscription) => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: `Sucessfully created subscription id: ${subscription.get('id')}`,
      })
    })
  })
  .catch(err => {
    console.error(err)
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Unable to create subscription'
      })
    })
  })
}

module.exports.subscribeActress = (event, context, callback) => {
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

  DMMClient.asyncActress({actress_id: event.pathParameters.id})
  .then(data => {
    if (data.result.result_count < 1) throw 'Not Found actress'
    const actress = data.result.actress[0]
    return Subscription.asyncCreate({name: `新着 ${actress.name}`, condition: condition, exceptCondition: exceptCondition})
  })
  .then((subscription) => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: `Sucessfully subscribe name: ${subscription.get('name')}`,
      })
    })
  })
  .catch(err => {
    if (err == 'Not Found actress') {
      callback(null, {
        statusCode: 404,
        body: JSON.stringify({
          message: `Not Found actress id: ${event.pathParameters.id}`,
        })
      })
    } else {
      console.error(err)
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to subscribe actress id: ${event.pathParameters.id}`
        })
      })
    }
    })
}

module.exports.index = (event, context, callback) => {
  Subscription.asyncAll(['id', 'name'])
  .then((subscriptions) => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(subscriptions.Items)
    })
  })
  .catch(err => {
    console.error(err)
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Unable to get subscriptions'
      })
    })
  })
}

module.exports.show = (event, context, callback) => {
  Subscription.asyncGet(event.pathParameters.id)
  .then(subscription => {
    if (! subscription) {
      callback(null, {
        statusCode: 404,
        body: JSON.stringify(`Not found subscription id: ${event.pathParameters.id}`)
      })
    } else {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(subscription.attrs)
      })
    }
  })
  .catch(err => {
    console.error(err)
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: `Unable to get subscription id: ${event.pathParameters.id}`
      })
    })
  })
}

module.exports.delete = (event, context, callback) => {
  Subscription.asyncDestroy(event.pathParameters.id, {ReturnValues: 'ALL_OLD'})
  .then((subscription) => {
    if (! subscription) {
      callback(null, {
        statusCode: 404,
        body: JSON.stringify(`Not found subscription id: ${event.pathParameters.id}`)
      })
    } else {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Sucessfully deleted subscription'
        })
      })
    }
  })
  .catch(err => {
    console.error(err)
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: `Unable to delete subscription id: ${event.pathParameters.id}`
      })
    })
  })
}