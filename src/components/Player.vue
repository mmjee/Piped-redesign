<template>
  <div
    data-shaka-player-container
    style="width: 100%; height: 100%; max-height: 75vh; min-height: calc(100vh - 64px); background: #000"
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

<style scoped>
.shaka-text-container > div {
  height: auto !important;
  width: auto !important;
  top: auto !important;
  left: auto !important;
}

.shaka-text-container * {
  background-color: rgba(8, 8, 8, 0.75) !important;
  color: white !important;
}
</style>

<script>
import muxjs from 'mux.js'
import shaka from 'shaka-player/dist/shaka-player.ui.js'
import 'shaka-player/dist/controls.css'
import { DashUtils } from '@/tools/DashUtils'

window.muxjs = muxjs

export default {
  props: {
    video: Object,
    sponsors: Object,
    selectedAutoPlay: Boolean,
    selectedAutoLoop: Boolean
  },
  data () {
    return {
      player: null
    }
  },
  computed: {
    shouldAutoPlay () {
      return this.$store.getters.getPreferenceBoolean('playerAutoPlay', true)
    },

    preferredVideoCodecs () {
      const preferredVideoCodecs = []
      if (this.$refs.videoEl.canPlayType('video/mp4; codecs="av01.0.08M.08"') !== '') { preferredVideoCodecs.push('av01') }
      if (this.$refs.videoEl.canPlayType('video/webm; codecs="vp9"') !== '') preferredVideoCodecs.push('vp9')
      if (this.$refs.videoEl.canPlayType('video/mp4; codecs="avc1.4d401f"') !== '') { preferredVideoCodecs.push('avc1') }
      return preferredVideoCodecs
    }
  },
  methods: {
    loadVideo () {
      const component = this
      const videoEl = this.$refs.videoEl

      videoEl.setAttribute('poster', this.video.thumbnailUrl)

      if (this.$route.query.t) videoEl.currentTime = this.$route.query.t

      const noPrevPlayer = !this.player

      const streams = []

      streams.push(...this.video.audioStreams)
      streams.push(...this.video.videoStreams)

      const MseSupport = window.MediaSource !== undefined

      let uri

      if (this.video.livestream) {
        uri = this.video.hls
      } else if (this.video.audioStreams.length > 0 && MseSupport) {
        if (!this.video.dash) {
          const dash = DashUtils.generate_dash_file_from_formats(
            streams,
            this.video.duration
          )
          uri = 'data:application/dash+xml;charset=utf-8;base64,' + btoa(dash)
        } else {
          uri = this.video.dash
        }
      } else {
        uri = this.video.videoStreams.filter(stream => stream.codec == null).slice(-1)[0].url
      }

      if (noPrevPlayer) {
        shaka.polyfill.installAll()

        const localPlayer = new shaka.Player(videoEl)

        localPlayer.getNetworkingEngine().registerRequestFilter((_type, request) => {
          const uri = request.uris[0]
          const url = new URL(uri)
          if (url.host.endsWith('.googlevideo.com')) {
            url.searchParams.set('host', url.host)
            url.host = new URL(component.video.proxyUrl).host
            request.uris[0] = url.toString()
          }
          if (url.pathname === '/videoplayback') {
            const headers = request.headers
            if (headers.Range) {
              url.searchParams.set('range', headers.Range.split('=')[1])
              request.headers = {}
              request.uris[0] = url.toString()
            }
          }
        })

        localPlayer.configure(
          'streaming.bufferingGoal',
          Math.max(this.$store.getters.getPreferenceNumber('bufferGoal', 10), 10)
        )

        this.setPlayerAttrs(localPlayer, videoEl, uri, shaka)
      } else this.setPlayerAttrs(this.player, videoEl, uri, shaka)

      if (noPrevPlayer) {
        videoEl.addEventListener('timeupdate', () => {
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
        })

        videoEl.addEventListener('volumechange', () => {
          this.$store.commit('setPrefs', {
            id: 'volume',
            value: videoEl.volume
          })
        })

        videoEl.addEventListener('ended', () => {
          if (!this.selectedAutoLoop && this.selectedAutoPlay && this.video.relatedStreams.length > 0) {
            const params = this.$route.query
            let url = this.video.relatedStreams[0].url
            const searchParams = new URLSearchParams()
            for (const param in params) {
              switch (param) {
                case 'v':
                case 't':
                  break
                default:
                  searchParams.set(param, params[param])
                  break
              }
            }
            const paramStr = searchParams.toString()
            if (paramStr.length > 0) url += '&' + paramStr
            this.$router.push(url)
          }
        })
      }

      // TODO: Add sponsors on seekbar: https://github.com/ajayyy/SponsorBlock/blob/e39de9fd852adb9196e0358ed827ad38d9933e29/src/js-components/previewBar.ts#L12
    },
    setPlayerAttrs (localPlayer, videoEl, uri, shaka) {
      if (!this.ui) {
        this.ui = new shaka.ui.Overlay(localPlayer, this.$refs.container, videoEl)

        const config = {
          overflowMenuButtons: ['quality', 'captions', 'picture_in_picture', 'playback_rate'],
          seekBarColors: {
            base: 'rgba(255, 255, 255, 0.3)',
            buffered: 'rgba(255, 255, 255, 0.54)',
            played: 'rgb(255, 0, 0)'
          }
        }

        this.ui.configure(config)
      }

      const player = this.ui.getControls().getPlayer()

      this.player = player

      const disableVideo = this.$store.getters.getPreferenceBoolean('listen', false) && !this.video.livestream

      this.player.configure({
        preferredVideoCodecs: this.preferredVideoCodecs,
        preferredAudioCodecs: ['opus', 'mp4a'],
        manifest: {
          disableVideo: disableVideo
        }
      })

      const quality = this.$store.getters.getPreferenceNumber('quality', 0)
      const qualityConds =
                quality > 0 && (this.video.audioStreams.length > 0 || this.video.livestream) && !disableVideo
      if (qualityConds) this.player.configure('abr.enabled', false)

      player.load(uri, 0, uri.indexOf('dash') >= 0 ? 'application/dash+xml' : 'video/mp4').then(() => {
        if (qualityConds) {
          let leastDiff = Number.MAX_VALUE
          let bestStream = null
          player
            .getVariantTracks()
            .sort((a, b) => a.bandwidth - b.bandwidth)
            .forEach(stream => {
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
        videoEl.volume = this.$store.getters.getPreferenceNumber('volume', 1)
      })
    }
  },
  activated () {
    import('hotkeys-js')
      .then(mod => mod.default)
      .then(hotkeys => {
        this.hotkeys = hotkeys
        const self = this
        hotkeys('f,m,j,k,l,space,up,down,left,right', function (e, handler) {
          const videoEl = self.$refs.videoEl
          switch (handler.key) {
            case 'f':
              if (document.fullscreenElement) document.exitFullscreen()
              else self.$refs.container.requestFullscreen()
              e.preventDefault()
              break
            case 'm':
              videoEl.muted = !videoEl.muted
              e.preventDefault()
              break
            case 'j':
              videoEl.currentTime = Math.max(videoEl.currentTime - 15, 0)
              e.preventDefault()
              break
            case 'l':
              videoEl.currentTime = videoEl.currentTime + 15
              e.preventDefault()
              break
            case 'k':
            case 'space':
              if (videoEl.paused) videoEl.play()
              else videoEl.pause()
              e.preventDefault()
              break
            case 'up':
              videoEl.volume = Math.min(videoEl.volume + 0.05, 1)
              e.preventDefault()
              break
            case 'down':
              videoEl.volume = Math.max(videoEl.volume - 0.05, 0)
              e.preventDefault()
              break
            case 'left':
              videoEl.currentTime = Math.max(videoEl.currentTime - 5, 0)
              e.preventDefault()
              break
            case 'right':
              videoEl.currentTime = videoEl.currentTime + 5
              e.preventDefault()
              break
          }
        })
      })
  },
  deactivated () {
    if (this.ui) {
      this.ui.destroy()
      this.ui = undefined
      this.player = undefined
    }
    if (this.player) {
      this.player.destroy()
      this.player = undefined
    }
    if (this.hotkeys) this.hotkeys.unbind()
    this.$refs.container.querySelectorAll('div').forEach(node => node.remove())
  }
}
</script>
