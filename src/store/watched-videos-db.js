import crypto from 'crypto'

import PouchDB from 'pouchdb'

function generateRandomID () {
  return crypto.randomBytes(16).toString('hex')
}

export const WatchedVideosDB = new PouchDB('WatchedVideosDB', {
  auto_compaction: true
})

export async function addWatchedVideo (videoObj, currentUrl) {
  return WatchedVideosDB.put({
    _id: generateRandomID(),
    video: videoObj,
    url: currentUrl,
    timestamp: new Date()
  })
}

export async function getWatchedVideos () {
  const data = await WatchedVideosDB.allDocs({
    include_docs: true
  })
  return data.rows.map(row => row.doc).map(doc => {
    doc.timestamp = new Date(doc.timestamp)
    return doc
  }).sort((a, b) => {
    return b.timestamp - a.timestamp
  })
}

export async function deleteWatchedVideos () {
  const docs = await getWatchedVideos()
  await WatchedVideosDB.bulkDocs(docs.map(doc => ({
    _id: doc._id,
    _rev: doc._rev,
    _deleted: true
  })))
}
