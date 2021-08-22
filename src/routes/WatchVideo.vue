<template>
  <ErrorHandler v-if="video && video.error" :message="video.message" :error="video.error" />
  <div v-else>
    <Player
      ref="videoPlayer"
      :video="video"
      :sponsors="sponsors"
      :selectedAutoPlay="this.$store.getters.getPreferenceBoolean('autoplay')"
      :selectedAutoLoop="selectedAutoLoop"
    />

    <v-row dense class="my-2">
      <v-col md="10" offset-md="1">
        <v-card outlined>
          <v-card-title class="text-h5">{{ video.title }}</v-card-title>
          <v-card-subtitle class="subtitle-1">
            <v-row>
              <v-col md="4" align-self="start">
                {{ addCommas(video.views) }} views
                •
                {{ video.uploadDate }}
              </v-col>
              <v-col offset-md="5" md="3" align-self="end">
                <v-icon>mdi-thumb-up</v-icon>
                <b class="ml-2">{{ addCommas(video.likes) }}</b>
                <v-icon class="ml-2">mdi-thumb-down</v-icon>
                <b class="ml-2">{{ addCommas(video.dislikes) }}</b>
                <v-btn icon class="ml-2" link :href="'https://youtu.be/' + getVideoId()" target="_blank">
                  <v-icon large>
                    mdi-youtube
                  </v-icon>
                </v-btn>
                <v-btn class="ml-2" link :href="'https://odysee.com/' + video.lbryId" v-if="video.lbryId" target="_blank" outlined>
                  LBRY
                </v-btn>
              </v-col>
            </v-row>
          </v-card-subtitle>
          <v-divider />
          <v-card-text>
            <router-link v-if="video.uploaderUrl" :to="video.uploaderUrl" custom v-slot="{ navigate }">
              <div
                style="justify-items: center; align-items: center; vertical-align: center; display: flex; cursor: pointer"
                @click="navigate" @keypress.enter="navigate" role="link"
              >
                <div>
                  <v-img :src="video.uploaderAvatar" height="48" width="48" class="rounded-circle" />
                </div>
                <div class="text-h5 ml-4">
                  {{ video.uploader }}
                </div>
                <div class="ml-4">
                  <v-btn
                    v-if="$store.state.isAuthenticated"
                    @click="subscribeHandler"
                    color="primary"
                  >
                    {{ subscribed ? "Unsubscribe" : "Subscribe" }}
                  </v-btn>
                </div>
              </div>
            </router-link>
            <div class="mt-4" v-html="video.description" />
            <v-divider class="my-4" />
            <div class="mt-4" v-if="showDesc && sponsors && sponsors.segments">
              Sponsors Segments: {{ sponsors.segments.length }}
            </div>
            <div>
              <v-checkbox dense :value="this.$store.getters.getPreferenceBoolean('autoplay')" @change="onAutoplayChg" label="Autoplay next video" />
              <v-checkbox dense v-model="selectedAutoLoop" label="Loop this video" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col md="8" offset-md="1" v-if="comments && comments.comments">
        <h5 class="display-1 text-center my-4">Comments</h5>
        <VideoComment v-for="comment in comments.comments" :key="comment.commentId" :comment="comment" :video="video" class="my-4" />
        <v-progress-linear indeterminate v-intersect="onCommentsProgressIntersect" v-if="comments.comments.length !== 0" />
      </v-col>
      <v-col md="2" v-if="video && video.relatedStreams">
        <h5 class="display-1 text-center my-4">Related Videos</h5>
        <VideoItem class="my-4" v-for="related in video.relatedStreams" :video="related" :key="related.url" />
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { LibPiped } from '@/tools/libpiped'

import Player from '@/components/Player.vue'
import VideoItem from '@/components/VideoItem.vue'
import ErrorHandler from '@/components/ErrorHandler.vue'
import VideoComment from '@/components/VideoComment'
import { addWatchedVideo } from '@/store/watched-videos-db'

export default {
  name: 'WatchVideo',
  data () {
    return {
      video: {
        title: 'Loading ...'
      },
      sponsors: null,
      selectedAutoLoop: false,
      showDesc: true,
      comments: null,
      subscribed: false,
      channelId: null
    }
  },
  metaInfo () {
    return {
      title: this.video.title
    }
  },

  mounted () {
    this.initialize()
  },
  watch: {
    '$route.query.v': function (v) {
      if (v) {
        window.scrollTo(0, 0)
      }
      this.initialize()
    }
  },
  methods: {
    initialize () {
      this.getVideoData().then(() => {
        this.$refs.videoPlayer.loadVideo()
      })
      this.getSponsors()
      if (this.$store.getters.getPreferenceBoolean('comments', true)) this.getComments()
    },

    numberFormat (...args) {
      return LibPiped.numberFormat(...args)
    },

    addCommas (...args) {
      return LibPiped.addCommas(...args)
    },

    fetchVideo () {
      return this.$store.dispatch('fetchJson', {
        path: '/streams/' + this.getVideoId()
      })
    },

    async fetchSponsors () {
      return this.$store.dispatch('fetchJson', {
        path: '/sponsors/' + this.getVideoId(),
        params: {
          category:
              '["' +
              this.$store.getters.getPreferenceString('selectedSkip', 'sponsor,interaction,selfpromo,music_offtopic').replaceAll(
                ',',
                '","'
              ) +
              '"]'
        }
      })
    },
    fetchComments () {
      return this.$store.dispatch('fetchJson', {
        path: '/comments/' + this.getVideoId()
      })
    },

    onCommentsProgressIntersect (entries) {
      if (entries[0].isIntersecting) {
        this.fetchMoreComments()
      }
    },

    fetchMoreComments () {
      this.$store.dispatch('fetchJson', {
        path: '/nextpage/comments/' + this.getVideoId(),
        params: {
          nextpage: this.comments.nextpage
        }
      }).then(json => {
        this.comments.nextpage = json.nextpage
        this.comments.comments = this.comments.comments.concat(json.comments)
      })
    },

    onAutoplayChg (ev) {
      this.$store.commit('setPrefs', {
        id: 'autoplay',
        value: ev
      })
    },

    getVideoData () {
      return this.fetchVideo()
        .then(data => {
          this.video = data
        })
        .then(() => {
          if (!this.video.error) {
            this.channelId = this.video.uploaderUrl.split('/')[2]
            this.fetchSubscribedStatus()

            this.video.description = LibPiped.purifyHTML(
              this.video.description
                .replaceAll('http://www.youtube.com', '')
                .replaceAll('https://www.youtube.com', '')
                .replaceAll('\n', '<br>')
            )
          }
        }).then(() => {
          return addWatchedVideo(this.video, this.$route.fullPath)
        })
    },
    async getSponsors () {
      if (this.$store.getters.getPreferenceString('sponsorblock', true)) { this.fetchSponsors().then(data => (this.sponsors = data)) }
    },
    async getComments () {
      this.fetchComments().then(data => (this.comments = data))
    },
    async fetchSubscribedStatus () {
      if (!this.channelId) return

      this.$store.dispatch('fetchJson', {
        path: '/subscribed',
        params: {
          channelId: this.channelId
        },
        options: {
          headers: {
            Authorization: this.$store.getters.getAuthToken
          }
        }
      }).then(json => {
        this.subscribed = json.subscribed
      })
    },
    subscribeHandler () {
      this.$store.dispatch('fetchJson', {
        path: (this.subscribed ? '/unsubscribe' : '/subscribe'),
        params: null,
        options: {
          method: 'POST',
          body: JSON.stringify({
            channelId: this.channelId
          }),
          headers: {
            Authorization: this.$store.getters.getAuthToken,
            'Content-Type': 'application/json'
          }
        }
      })
      this.subscribed = !this.subscribed
    },

    getVideoId () {
      return this.$route.query.v || this.$route.params.v
    }
  },
  components: {
    VideoComment,
    Player,
    VideoItem,
    ErrorHandler
  }
}
</script>
