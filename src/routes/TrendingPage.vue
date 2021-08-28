<template>
  <v-container fluid>
    <h3 class="text-h4 justify-center">{{ $t('titles.trending') }}</h3>

    <v-divider class="my-4" />

    <v-row v-for="(row, rowId) in chunkedByFour" :key="rowId">
      <v-col md="3" v-for="(video, videoId) in row" :key="videoId">
        <VideoItem :video="video" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { chunk as _chunk } from 'lodash-es'

import VideoItem from '@/components/VideoItem.vue'

export default {
  data () {
    return {
      videos: []
    }
  },

  metaInfo () {
    return {
      title: this.$t('titles.trending')
    }
  },

  mounted () {
    const region = this.$store.getters.getPreferenceString('region', 'US')

    this.fetchTrending(region).then(videos => (this.videos = videos))
  },
  methods: {
    async fetchTrending (region) {
      return this.$store.dispatch('fetchJson', {
        path: '/trending',
        params: {
          region: region || 'US'
        }
      })
    }
  },
  computed: {
    chunkedByFour () {
      return _chunk(this.videos, 4)
    }
  },
  components: {
    VideoItem
  }
}
</script>
