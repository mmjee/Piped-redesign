import Dexie from 'dexie'
import { initializeDexieTables } from 'libeds/dexiesync'

import { EDS } from '@/plugins/eds'

export const PMDB = new Dexie('PipedMaterialDB')

PMDB.version(3).stores({
	watchedVideos: '++id,videoId,progressPcnt,timestamp'
})

export async function syncPMDB () {
	return initializeDexieTables({ EDS, tableList: [PMDB.watchedVideos] })
}

export async function addWatchedVideo (videoObj) {
	return PMDB.watchedVideos.add({
		videoId: videoObj.videoId,
		video: videoObj,
		progress: 0,
		progressPcnt: 0,
		timestamp: new Date()
	})
}

export function updateWatchedVideoProgress (videoID, prog, dur) {
	return PMDB.watchedVideos.update(videoID, {
		progress: prog,
		progressPcnt: Math.min((prog / dur) * 100, 100)
	})
}

export async function findLastWatch (videoId) {
	const v = await PMDB.watchedVideos.where('videoId').equals(videoId).reverse().sortBy('progressPcnt')
	return v[0]
}

export function deleteWatchedVideos () {
	return PMDB.watchedVideos.clear()
}
