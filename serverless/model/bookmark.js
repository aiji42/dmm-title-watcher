'use strict'

const { Bookmark } = require('./table-schema')
const { Product } = require('./product')

Bookmark.scanRemindable = function() {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, today.getHours(), today.getMinutes(), today.getSeconds())
  return new Promise((resolve, reject) => {
    Bookmark.scan()
      .where('saleStartDate').between(yesterday, today)
      .exec((err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
  })
}

Bookmark.prototype.remindNotifySlack = function() {
  const product = new Product({id: this.get('productId'), info: this.get('productInfo')})
  return product.remindNotifySlack()
}

module.exports.Bookmark = Bookmark