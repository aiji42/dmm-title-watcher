'use strict'

const { Product } = require('./model/product')
const { Bookmark } = require('./model/bookmark')

module.exports.create = (event, context, callback) => {
  Product.asyncGet(event.pathParameters.id)
    .then(product => Bookmark.asyncCreate({
        productId: product.get('id'),
        saleStartDate: product.get('info').date,
        productInfo: product.get('info')
      })
    )
    .then(bookmark => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully create bookmark productId: ${event.pathParameters.id}`
        })
      })
    })
    .catch(err => {
      console.error(err)
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to create bookmark productId: ${event.pathParameters.id}`
        })
      })
    })
}

module.exports.delete = (event, context, callback) => {
  Bookmark.asyncDestroy(event.pathParameters.id)
    .then(() => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Sucessfully deleted bookmark'
        })
      })
    })
    .catch(err => {
      console.error(err)
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to delete bookmark productId: ${event.pathParameters.id}`
        })
      })
    })
}

module.exports.remind = (event, context, callback) => {
  Bookmark.scanRemindable()
    .then(data => Promise.all(data.Items.map(bookmark => bookmark.remindNotifySlack())))
    .then(() => callback(null, 'Sucessfully reminded bookmark'))
    .catch(err => {console.error(err); callback(null, 'Unable to remind bookmark')})
}