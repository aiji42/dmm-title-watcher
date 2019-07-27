'use strict'

const mochaPlugin = require('serverless-mocha-plugin')
const expect = mochaPlugin.chai.expect
const { Torrent } = require('../model/torrent')
const initialTorrents = require('./initials/torrent.json')

describe('Torrents', () => {
  const initialTorrent = initialTorrents[0]
  before(done => {
    (async () => {
      await Torrent.asyncCreateTable()
      await Torrent.asyncCreate(initialTorrent)
      done()
    })()
  })

  describe('Download', () => {
    const wrapped = mochaPlugin.getWrapper('torrentsDownload', '/torrents.js', 'download')
    it('Regular request succeed', () => {
      return wrapped.run({productId: initialTorrent.productId, torrentId: initialTorrent.torrentId}).then(response => expect(response.statusCode).to.be.equal(200))
    })
    it('Torrent status is running', () => {
      Torrent.asyncGet(initialTorrent.productId, initialTorrent.torrentId)
      .then(torrent => expect(torrent.get('status')).to.be.equal('running'))
    })
  })

  after(done => {
    (async () => {
      await Torrent.asyncDeleteTable()
      done()
    })()
  })
})