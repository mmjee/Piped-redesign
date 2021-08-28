<template>
  <v-progress-linear height="1vh" indeterminate v-if="loaded === false" />
  <v-container fluid v-else>
    <v-row>
      <v-col md="2">
        <v-btn outlined @click="deleteWatchHistory" x-large>Delete History</v-btn>
      </v-col>
    </v-row>
    <v-row v-for="(chunk, chunkId) in chunkedByFour" :key="chunkId">
      <v-col md="3" v-for="doc in chunk" :key="doc._id">
        <VideoItem :video="doc.video">
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on">
                Watched {{ doc.timeAgo }}
              </span>
            </template>
            <span>{{ doc.formattedDate }}</span>
          </v-tooltip><br />
        </VideoItem>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import _chunk from 'lodash-es/chunk'

import { deleteWatchedVideos, getWatchedVideos } from '@/store/watched-videos-db'
import { LibPiped } from '@/tools/libpiped'
import VideoItem from '@/components/VideoItem'

export default {
  components: {
    VideoItem
  },
  data: () => ({
    loaded: false,
    data: null,
    headers: [
      {
        text: 'Title',
        value: 'video.title'
      },
      {
        text: 'Date & Time',
        value: 'timestamp'
      },
      {
        text: 'URL',
        value: 'url'
      }
    ]
  }),

  metaInfo () {
    return {
      title: this.$t('titles.history')
    }
  },

  methods: {
    async loadData () {
      this.data = (await getWatchedVideos()).map(doc => {
        doc.timeAgo = LibPiped.timeAgo(doc.timestamp)
        doc.formattedDate = LibPiped.formatFullDate(doc.timestamp)
        return doc
      })
      this.loaded = true
    },

    async deleteWatchHistory () {
      await deleteWatchedVideos()
      await this.loadData()
    }
  },

  computed: {
    chunkedByFour () {
      return _chunk(this.data, 4)
    }
  },

  mounted () {
    this.loadData().catch(e => console.error(e))
  }
}
</script>
