<template>
    <ErrorHandler v-if="channel && channel.error" :message="channel.message" :error="channel.error" />
    <v-container fluid v-else-if="channel">
      <v-card class="pa-4">
        <div
          style="justify-items: center; align-items: center; vertical-align: center; display: flex;"
        >
          <div>
            <v-img :src="channel.avatarUrl" height="48" width="48" class="rounded-circle" />
          </div>
          <div class="text-h5 ml-4">
            {{ channel.name }}
          </div>
        </div>
        <v-card-text>
          <div v-html="renderedDescription" />
        </v-card-text>
      </v-card>

      <v-divider class="my-4" />

      <div v-if="this.channel && this.channel.relatedStreams">
        <v-row v-for="(row, rowId) in chunkedByFour" :key="rowId">
          <v-col md="3" v-for="(video, videoId) in row" :key="videoId">
            <VideoItem :height="270" :width="480" :video="video" />
          </v-col>
        </v-row>
        <v-progress-linear v-if="channel.nextpage != null" indeterminate v-intersect="onRelatedStreamsEndIntersect" />
      </div>
    </v-container>
</template>

<script>
import marked from 'marked'
import { chunk as _chunk } from 'lodash-es'

import ErrorHandler from '@/components/ErrorHandler'
import VideoItem from '@/components/VideoItem.vue'

import { LibPiped } from '@/tools/libpiped'

export default {
  data () {
    return {
      channel: null,
      subscribed: false
    }
  },
  metaInfo () {
    return { title: this.channel ? this.channel.name : 'Loading' }
  },

  mounted () {
    this.getChannelData()
  },
  methods: {
    async fetchChannel () {
      return this.$store.dispatch('fetchJson', {
        path: '/' + this.$route.params.path + '/' + this.$route.params.channelId
      })
    },
    async getChannelData () {
      this.fetchChannel()
        .then(data => (this.channel = data))
    },

    onRelatedStreamsEndIntersect (entries) {
      if (entries[0].isIntersecting) {
        this.fetchMoreVideos()
      }
    },

    fetchMoreVideos () {
      this.$store.dispatch('fetchJson', {
        path: '/nextpage/channel/' + this.channel.id,
        params: {
          nextpage: this.channel.nextpage
        }
      }).then(j => {
        this.channel.relatedStreams = this.channel.relatedStreams.concat(j.relatedStreams)
        this.channel.nextpage = j.nextpage
      })
    }
  },
  computed: {
    renderedDescription () {
      return LibPiped.purifyHTML(marked.parseInline(this.channel.description, {
        breaks: true
      }))
    },

    chunkedByFour () {
      return _chunk(this.channel.relatedStreams, 4)
    }
  },
  components: {
    ErrorHandler,
    VideoItem
  }
}
</script>
