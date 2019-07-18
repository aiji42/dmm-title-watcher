'use strict'

const util = require('util')
const DMM = require('dmm.js')
const client = new DMM.Client({
  api_id: process.env.DMM_API_ID,
  affiliate_id: process.env.DMM_AFFILIATE_ID
})

client.asyncProduct = util.promisify(client.product)
client.asyncActress = util.promisify(client.actress)

client.findActress = async (id) => {
  const data = await client.asyncActress({actress_id: id})
  if (data.result.result_count < 1) throw 'Not Found actress'
  return data.result.actress[0]
}

module.exports.DMMClient = client