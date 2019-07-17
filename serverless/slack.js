'use strict'

const qs = require('querystring')
const { Bookmark } = require('./model/bookmark')
const { Product } = require('./model/product')
const { DMMClient } = require('./util/dmm-client')
const AWS = require('aws-sdk')
const lambdaConfig = {}
if (process.env.STAGE != 'prod') lambdaConfig.endpoint = process.env.GW_URL
const lambda = new AWS.Lambda(lambdaConfig)

module.exports.actionEndpoint = (event, context, callback) => {
  const data = JSON.parse(qs.parse(event.body).payload)
  if (data.callback_id == 'bookmark') {
    bookmark(data).then(msg => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(msg)
      })
    })
  } else if (data.callback_id == 'subscription') {
    subscription(data).then(msg => {
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

module.exports.command = (event, context, callback) => {
  const command = qs.parse(event.body).command
  const text = qs.parse(event.body).text
  if (command == '/subscriptions') {
    subscriptions().then(msg => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(msg)
      })
    })
  } else if (command == '/actress') {
    actress(text).then(msg => {
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

const subscription = async (data) => {
  if (data.actions[0].name == 'actress') {
    const res = await lambda.invoke({
      FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_SUBSCRIBE_ACTRESS,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({pathParameters: {id: data.actions[0].value}})
    }).promise()
    return JSON.parse(res.Payload).body
  } else if (data.actions[0].name == 'delete') {
    const res = await lambda.invoke({
      FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_DELETE,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({pathParameters: {id: data.actions[0].value}})
    }).promise()
    return JSON.parse(res.Payload).body
  }
}

const subscriptions = async () => {
  const res = await lambda.invoke({
    FunctionName: process.env.LAMBDA_NAME_SUBSCRIPTIONS_INDEX,
    InvocationType: 'RequestResponse',
    Payload: ''
  }).promise()
  const subscriptions = JSON.parse(JSON.parse(res.Payload).body)
  const attachments = subscriptions.map(subscription => {
    return {
      title: subscription.name,
      callback_id: 'subscription',
      actions: [
        {
          type: 'button',
          name: 'delete',
          text: '解除する',
          value: subscription.id,
          style: 'danger',
          confirm: {
            title: '購読を解除しますか？',
            ok_text: 'Yes',
            dismiss_text: 'No'
          }
        }
      ]
    }
  })
  return {text: '購読一覧', attachments: attachments}
}

const actress = async (text) => {
  const data = await DMMClient.asyncActress({keyword: text})
  const attachments = data.result.actress.map(actress => {
    const attachment = {
      title: actress.name,
      title_link: actress.listURL.digital,
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
  })
  return {text: `${attachments.length}人の女優が見つかりました。`, attachments: attachments}
}