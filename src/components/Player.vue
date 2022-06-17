<template>
  <div
    data-shaka-player-container
    style="width: 100%; height: calc(100vh - 48px); background: #000"
    ref="container"
  >
    <video
      data-shaka-player
      style="min-width: 100%;"
      :autoplay="shouldAutoPlay"
      :loop="selectedAutoLoop"
      ref="videoEl"
    ></video>
  </div>
</template>

<script>
import muxjs from 'mux.js'
import shaka from 'shaka-player/dist/shaka-player.ui.js'
import 'shaka-player/dist/controls.css'

import { DashUtils } from '@/tools/DashUtils'
import '@/components/Player.scss'

import { setupKeybindings } from 'psychic-tiny-keys'

window.muxjs = muxjs

export default {
	props: {
		video: Object,
		sponsors: Object,
		initialSkip: Number,
		selectedAutoLoop: Boolean
	},
	data () {
		return {
			$player: null,
			$ui: null,
			access: []
		}
	},
	computed: {
		shouldAutoPlay () {
			return this.$store.getters['prefs/getPreferenceBoolean']('playerAutoPlay', true)
		},

		preferredVideoCodecs () {
			const preferredVideoCodecs = []
			if (this.$refs.videoEl.canPlayType('video/mp4; codecs="av01.0.08M.08"') !== '') { preferredVideoCodecs.push('av01') }
			if (this.$refs.videoEl.canPlayType('video/webm; codecs="vp9"') !== '') preferredVideoCodecs.push('vp9')
			if (this.$refs.videoEl.canPlayType('video/mp4; codecs="avc1.4d401f"') !== '') { preferredVideoCodecs.push('avc1') }
			return preferredVideoCodecs
		},

		shouldShowMarkers () {
			return this.$store.getters['prefs/getPreferenceBoolean']('showMarkers', true) && this.$store.getters['prefs/getPreferenceBoolean']('sponsorblock', true)
		}
	},
	methods: {
		getCurrentTime () {
			// UNCLEAN
			return this.$refs.videoEl ? this.$refs.videoEl.currentTime : undefined
		},

		getAccess () {
			return this.access
		},

		skipToTime (timeInSeconds) {
			this.$refs.videoEl.currentTime = timeInSeconds
		},

		async loadVideo () {
			console.log('PIPED | LOADING VIDEO')
			const component = this
			const videoEl = this.$refs.videoEl

			videoEl.setAttribute('poster', this.video.thumbnailUrl)

			if (this.initialSkip != null && Number.isFinite(this.initialSkip)) this.skipToTime(this.initialSkip)

			const noPrevPlayer = !this.$player

			const streams = []

			streams.push(...this.video.audioStreams)
			streams.push(...this.video.videoStreams)

			const MseSupport = window.MediaSource !== undefined
			const lbry = this.$store.getters['prefs/getPreferenceBoolean']('disableLBRY', true)
				? null
				: this.video.videoStreams.filter(stream => stream.quality === 'LBRY')[0]
			let uri, mime

			if (this.video.livestream) {
				uri = this.video.hls
				mime = 'application/x-mpegURL'
			} else if (this.video.audioStreams.length > 0 && !lbry && MseSupport) {
				if (!this.video.dash) {
					const dash = DashUtils.generate_dash_file_from_formats(
						streams,
						this.video.duration
					)
					uri = 'data:application/dash+xml;charset=utf-8;base64,' + btoa(dash)
				} else {
					uri = this.video.dash
				}
				mime = 'application/dash+xml'
			} else if (lbry) {
				uri = lbry.url
				if (this.$store.getters['prefs/getPreferenceBoolean']('proxyLBRY', true)) {
					const url = new URL(uri)
					url.searchParams.set('host', url.host)
					url.host = new URL(this.video.proxyUrl).host
					uri = url.toString()
				}
				mime = await fetch(uri, {
					method: 'HEAD'
				}).then(response => response.headers.get('Content-Type'))
			} else if (this.video.hls) {
				uri = this.video.hls
				mime = 'application/x-mpegURL'
			} else {
				uri = this.video.videoStreams.filter(stream => stream.codec == null).slice(-1)[0].url
			}
			this.access = [uri, mime]

			if (noPrevPlayer) {
				shaka.polyfill.installAll()

				const localPlayer = new shaka.Player(videoEl)
				const proxyHost = new URL(component.video.proxyUrl).host

				localPlayer.getNetworkingEngine().registerRequestFilter((_type, request) => {
					const uri = request.uris[0]
					const url = new URL(uri)
					const headers = request.headers
					if (
						url.host.endsWith('.googlevideo.com') ||
            (url.host.endsWith('.lbryplayer.xyz') && (this.$store.getters['prefs/getPreferenceBoolean']('proxyLBRY', true) || headers.Range))
					) {
						url.searchParams.set('host', url.host)
						url.host = proxyHost
						request.uris[0] = url.toString()
					}

					if (url.pathname === '/videoplayback') {
						if (headers.Range) {
							url.searchParams.set('range', headers.Range.split('=')[1])
							request.headers = {}
							request.uris[0] = url.toString()
						}
					}
				})

				localPlayer.configure(
					'streaming.bufferingGoal',
					this.$store.getters['prefs/getPreferenceNumber']('bufferGoal', 10)
				)

				this.setPlayerAttrs(localPlayer, videoEl, uri, mime, shaka)
			} else this.setPlayerAttrs(this.$player, videoEl, uri, mime, shaka)

			if (noPrevPlayer) {
				videoEl.addEventListener('timeupdate', (ev) => {
					if (this.sponsors && this.sponsors.segments) {
						const time = videoEl.currentTime
						this.sponsors.segments.forEach(segment => {
							if (!segment.skipped || this.selectedAutoLoop) {
								const end = segment.segment[1]
								if (time >= segment.segment[0] && time < end) {
									console.log('Skipped segment at ' + time)
									videoEl.currentTime = end
									segment.skipped = true
								}
							}
						})
					}
					this.$emit('timeupdate', ev)
				})

				videoEl.addEventListener('volumechange', () => {
					this.$store.commit('prefs/setPrefs', {
						id: 'volume',
						value: videoEl.volume
					})
				})

				videoEl.addEventListener('ratechange', (e) => {
					const rate = videoEl.playbackRate
					if (!(rate > 0 && !Number.isNaN(videoEl.duration) && !Number.isNaN(videoEl.duration - e.timeStamp / 1000))) {
						return
					}
					this.$store.commit('prefs/setPrefs', {
						id: 'rate',
						value: videoEl.playbackRate
					})
				})

				videoEl.addEventListener('ended', () => {
					this.$emit('videoEnded')
				})
			}

			this.createMarkers()
		},
		setPlayerAttrs (localPlayer, videoEl, uri, mime, shaka) {
			if (!this.$ui) {
				this.destroy()
				this.$ui = new shaka.ui.Overlay(localPlayer, this.$refs.container, videoEl)

				const config = {
					overflowMenuButtons: ['quality', 'captions', 'picture_in_picture', 'playback_rate'],
					seekBarColors: {
						base: 'rgba(255, 255, 255, 0.3)',
						buffered: 'rgba(255, 255, 255, 0.54)',
						played: 'rgb(255, 0, 0)'
					}
				}

				this.$ui.configure(config)
			}

			const player = this.$ui.getControls().getPlayer()

			this.$player = player

			const disableVideo = this.$store.getters['prefs/getPreferenceBoolean']('listen', false) && !this.video.livestream

			this.$player.configure({
				preferredVideoCodecs: this.preferredVideoCodecs,
				preferredAudioCodecs: ['opus', 'mp4a'],
				manifest: {
					disableVideo: disableVideo,
					hls: {
						useFullSegmentsForStartTime: true
					}
				},
				streaming: {
					useNativeHlsOnSafari: false
				}
			})

			const quality = this.$store.getters['prefs/getPreferenceNumber']('quality', 0)
			const qualityConds = quality > 0 && (this.video.audioStreams.length > 0 || this.video.livestream) && !disableVideo
			if (qualityConds) this.$player.configure('abr.enabled', false)

			player.load(uri, 0, mime).then(() => {
				if (qualityConds) {
					let leastDiff = Number.MAX_VALUE
					let bestStream = null

					let bestAudio = 0
					// Choose the best audio stream
					if (qualityConds >= 480) {
						player.getVariantTracks().forEach(track => {
							const audioBandwidth = track.audioBandwidth
							if (audioBandwidth > bestAudio) bestAudio = audioBandwidth
						})
					}

					player
						.getVariantTracks()
						.sort((a, b) => a.bandwidth - b.bandwidth)
						.forEach(stream => {
							if (stream.audioBandwidth < bestAudio) return

							const diff = Math.abs(quality - stream.height)
							if (diff < leastDiff) {
								leastDiff = diff
								bestStream = stream
							}
						})

					player.selectVariantTrack(bestStream)
				}

				this.video.subtitles.forEach(subtitle => {
					player.addTextTrackAsync(
						subtitle.url,
						subtitle.code,
						'SUBTITLE',
						subtitle.mimeType,
						null,
						subtitle.name
					)
				})
				videoEl.volume = this.$store.getters['prefs/getPreferenceNumber']('volume', 1)

				{
					const rate = this.$store.getters['prefs/getPreferenceNumber']('rate', 1)
					player.trickPlay(rate)
					player.playbackRate = rate
					player.defaultPlaybackRate = rate
				}
			})
		},

		createMarkers () {
			const markers = this.$refs.container.querySelector('.shaka-ad-markers')
			if (!this.shouldShowMarkers) {
				markers.style.background = 'none'
				return false
			}

			const array = ['to right']
			this.sponsors?.segments?.forEach(segment => {
				const start = (segment.segment[0] / this.video.duration) * 100
				const end = (segment.segment[1] / this.video.duration) * 100
				let color
				switch (segment.category) {
					case 'sponsor':
						color = '#b8bb26'
						break
					case 'selfpromo':
						color = '#fabd2f'
						break
					case 'interaction':
						color = '#d3869b'
						break
					case 'poi_highlight':
						color = '#b16286'
						break
					case 'intro':
						color = '#83A598'
						break
					case 'outro':
						color = '#8ec07c'
						break
					case 'preview':
						color = '#458588'
						break
					case 'filler':
						color = '#689d6a'
						break
					case 'music_offtopic':
						color = '#fe8019'
						break
					default:
						color = '#fbf1c7'
				}
				array.push(`transparent ${start}%`)
				array.push(`${color} ${start}%`)
				array.push(`${color} ${end}%`)
				array.push(`transparent ${end}%`)
			})
			if (array.length <= 1) {
				return
			}
			markers.style.background = `linear-gradient(${array.join(',')})`
		},

		destroy () {
			if (this.$ui) {
				this.$ui.destroy()
				this.$ui = undefined
				this.$player = undefined
			}
			if (this.$player) {
				this.$player.destroy()
				this.$player = undefined
			}
			if (this.$refs.container) this.$refs.container.querySelectorAll('div').forEach(node => node.remove())
		}
	},

	watch: {
		'video.videoId' () {
			this.loadVideo()
		},
		shouldShowMarkers: 'createMarkers'
	},

	mounted () {
		this.loadVideo()
		const self = this
		const videoEl = self.$refs.videoEl
		const onSpace = (e) => {
			if (videoEl.paused) videoEl.play()
			else videoEl.pause()
			e.preventDefault()
		}

		this.unsubToKeybindings = setupKeybindings(window, {
			f (e) {
				if (document.fullscreenElement) document.exitFullscreen()
				else self.$refs.container.requestFullscreen()
				e.preventDefault()
			},
			m (e) {
				videoEl.muted = !videoEl.muted
				e.preventDefault()
			},
			j (e) {
				videoEl.currentTime = Math.max(videoEl.currentTime - 15, 0)
				e.preventDefault()
			},
			l (e) {
				videoEl.currentTime = videoEl.currentTime + 15
				e.preventDefault()
			},
			c (e) {
				self.$player.setTextTrackVisibility(!self.$player.isTextTrackVisible())
				e.preventDefault()
			},
			Space: onSpace,
			k: onSpace,
			ArrowUp (e) {
				videoEl.volume = Math.min(videoEl.volume + 0.05, 1)
				e.preventDefault()
			},
			ArrowDown (e) {
				videoEl.volume = Math.max(videoEl.volume - 0.05, 0)
				e.preventDefault()
			},
			ArrowLeft (e) {
				videoEl.currentTime = Math.max(videoEl.currentTime - 5, 0)
				e.preventDefault()
			},
			ArrowRight (e) {
				videoEl.currentTime = videoEl.currentTime + 5
				e.preventDefault()
			},
			'Shift+>' (e) {
				self.$player.trickPlay(Math.min(videoEl.playbackRate + 0.25, 2))
				e.preventDefault()
			},
			'Shift+<' (e) {
				self.$player.trickPlay(Math.max(videoEl.playbackRate - 0.25, 0.25))
				e.preventDefault()
			}
		})
	},

	beforeDestroy () {
		this.destroy()
		if (this.unsubToKeybindings) this.unsubToKeybindings()
	}
}
</script>
