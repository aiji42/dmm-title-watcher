'use strict'

const util = require('util')
const DMM = require('dmm.js')
const client = new DMM.Client({
  api_id: process.env.DMM_API_ID,
  affiliate_id: process.env.DMM_AFFILIATE_ID
})

client.asyncProduct = util.promisify(client.product)
client.asyncActress = util.promisify(client.actress)
client.asyncGenre   = util.promisify(client.genre)

client.findActress = async (id) => {
  const result = (await client.asyncActress({actress_id: id})).result
  if (result.result_count < 1) throw Error('Not Found actress')
  return result.actress[0]
}

client.findGenre = async (keyword) => {
  const result = (await client.asyncGenre({floor_id: 43, initial: keyword.slice(0,1)})).result
  if (result.result_count < 1) throw Error('Not Found genre')

  const genres = result.genre.filter(genre => genre.ruby == keyword)
  if (genres.length < 1) throw Error('Not Found genre')
  return genres[0]
}

module.exports.DMMClient = client