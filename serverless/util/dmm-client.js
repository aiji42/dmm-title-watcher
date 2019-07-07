'use strict'

const util = require('util')
const DMM = require('dmm.js')
const client = new DMM.Client({
  api_id: process.env.DMM_API_ID,
  affiliate_id: process.env.DMM_AFFILIATE_ID
})

client.asyncProduct = util.promisify(client.product)
client.asyncActress = util.promisify(client.actress)

module.exports.DMMClient = client