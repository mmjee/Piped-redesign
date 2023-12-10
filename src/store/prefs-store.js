import { isString, set as _set } from 'lodash-es'

export const COLOR_SCHEME_STATES = {
	LIGHT: 0,
	DARK: 1,
	SYSTEM: 2
}

const PrefsStore = {
	namespaced: true,
	state: () => ({
		// Not a normal pref
		colorScheme: COLOR_SCHEME_STATES.SYSTEM,

		// Default values
		prefs: {
			playerAutoplay: true,
			autoplay: false,
			listen: false,
			sponsorblock: true,
			skipToLastPoint: true,
			clickbaitThumbnailAvoidance: false,
			disableDuplicateHistoryEntries: false,

			filterOutShortsInFeedPage: false,
			filterOutShortsInSearchResults: false,
			disableCommentsByDefault: false,
			showRelatedVideos: true,
			showMarkers: true,
			disableLBRY: true,
			proxyLBRY: true,
			homepageButton: false,
			enableCustomInstance: false,

			selectedSkip: [],
			codecs: ['av01', 'avc1', 'vp9']
		}
	}),
	mutations: {
		setColorScheme (state, { colorScheme }) {
			state.colorScheme = colorScheme
			window.localStorage.setItem('COLOR_SCHEME', JSON.stringify(colorScheme))
		},

		setPrefs (state, {
			id,
			value
		}) {
			_set(state.prefs, id, value)
			window.localStorage.setItem('PREFERENCES', JSON.stringify(state.prefs))
		},

		replacePrefs (state, nextPrefs) {
			state.prefs = Object.assign({}, state.prefs, nextPrefs)
		}
	},
	actions: {
		loadState ({ commit }) {
			try {
				const cs = window.localStorage.getItem('COLOR_SCHEME')
				if (isString(cs) && cs.length !== 0) {
					commit('setColorScheme', { colorScheme: JSON.parse(cs) })
				}

				const jv = window.localStorage.getItem('PREFERENCES')
				if (isString(jv) && jv.length !== 0) {
					const p = JSON.parse(jv)
					commit('replacePrefs', p)
				}
			} catch (e) {
				console.log('Error:', e)
			}
		}
	},

	getters: {
		getPreference: state => (id, default_) => {
			const pref = state.prefs[id]
			return pref != null ? pref : default_
		},

		getPreferenceBoolean: (_, getters) => (...args) => {
			const v = getters.getPreference(...args)

			switch (v) {
				case 'true':
				case true:
				case '1':
				case 'on':
				case 'yes':
					return true
				default:
					return false
			}
		},

		getPreferenceNumber: (_, getters) => (id, default_) => {
			const v = getters.getPreference(id, default_)

			const n = Number(v)
			if (!Number.isFinite(n)) {
				return default_
			} else {
				return n
			}
		},

		apiUrl (state) {
			return state.prefs.instance ?? process.env.VUE_APP_PIPED_URL ?? 'https://pipedapi.kavin.rocks'
		},

		isEmbedded () {
			return window.self !== window.top
		}
	}
}

function initializePrefEvents (store) {
	window.addEventListener('storage', (storageEv) => {
		if (storageEv.key === 'PREFERENCES') {
			store.commit('prefs/replacePrefs', JSON.parse(storageEv.newValue))
		} else if (storageEv.key === 'COLOR_SCHEME') {
			store.commit('prefs/setColorScheme', {
				colorScheme: JSON.parse(storageEv.newValue)
			})
		}
	})
}

export {
	PrefsStore,
	initializePrefEvents
}
