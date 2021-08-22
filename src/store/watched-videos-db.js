import crypto from 'crypto'

import PouchDB from 'pouchdb'

function generateRandomID () {
  return crypto.randomBytes(16).toString('hex')
}

export const WatchedVideosDB = new PouchDB('WatchedVideosDB')

export async function addWatchedVideo (videoObj) {
  return WatchedVideosDB.put({
    _id: generateRandomID(),
    ...videoObj
  })
}

export async function getWatchedVideos () {
  const data = await WatchedVideosDB.allDocs({
    include_docs: true
  })
  return data.rows.map(row => row.doc)
}

export async function deleteWatchedVideos () {
  const docs = await WatchedVideosDB.allDocs()
  await WatchedVideosDB.bulkDocs(docs.map(doc => ({
    _id: doc._id,
    _rev: doc._rev,
    _deleted: true
  })))
}
