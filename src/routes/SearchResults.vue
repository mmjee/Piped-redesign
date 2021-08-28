<template>
  <v-container fluid>
    <h5 class="text-h5 text-center">
      {{ $route.query.search_query }}
    </h5>

    <v-select
      label="Filter videos"
      v-model="selectedFilter"
      :items="availableFilters"
    />
    <v-divider class="my-4" />

    <div v-if="results && results.items">
      <v-row v-for="(row, rowId) in chunkedByFour" :key="rowId">
        <v-col md="3" v-for="(video, videoId) in row" :key="videoId">
          <VideoItem :height="270" :width="480" :video="video" v-if="video.type === 'VIDEO'" />
          <GenericDisplayItem :height="270" :width="480" :item="video" v-else />
        </v-col>
      </v-row>
      <v-progress-linear indeterminate v-intersect="onSearchResultsEndIntersect" v-if="results.nextpage != null" />
    </div>
  </v-container>
</template>

<script>
import { chunk as _chunk } from 'lodash-es'

import { LibPiped } from '@/tools/libpiped'
import VideoItem from '@/components/VideoItem'
import GenericDisplayItem from '@/components/GenericDisplayItem'

export default {
  components: { GenericDisplayItem, VideoItem },
  data () {
    return {
      results: null,
      availableFilters: [
        'all',
        'videos',
        'channels',
        'playlists',
        'music_songs',
        'music_videos',
        'music_albums',
        'music_playlists'
      ],
      selectedFilter: 'all'
    }
  },
  metaInfo () {
    return {
      title: this.$route.query.search_query
    }
  },

  mounted () {
    this.updateResults()
  },
  computed: {
    chunkedByFour () {
      return _chunk(this.results.items, 4)
    }
  },
  watch: {
    selectedFilter () {
      this.updateResults()
    },

    // For history navigation
    '$route.query.search_query' () {
      this.updateResults()
    }
  },

  methods: {
    rationalizeSearchResult (sr) {
      let type
      // This seriously can't be the best solution
      if (sr.url.startsWith('/watch')) {
        type = 'VIDEO'
      } else if (sr.url.startsWith('/playlist')) {
        type = 'PLAYLIST'
      } else if (sr.url.startsWith('/channel')) {
        type = 'CHANNEL'
      } else {
        console.warn('WARNING: UNKNOWN VIDEO URL TYPE FOUND:', sr.url)
        type = 'VIDEO'
      }

      return {
        title: sr.name,
        type,
        uploaderName: sr.uploader,
        uploadedDate: sr.uploadDate,
        ...sr
      }
    },

    async fetchResults () {
      return this.$store.dispatch('fetchJson', {
        path: 'search',
        params: {
          q: this.$route.query.search_query,
          filter: this.selectedFilter
        }
      })
    },

    numberFormat (...args) {
      return LibPiped.numberFormat(...args)
    },

    timeFormat (...args) {
      return LibPiped.timeFormat(...args)
    },
    async updateResults () {
      this.results = this.fetchResults().then(json => {
        json.items = json.items.map(this.rationalizeSearchResult)
        this.results = json
      })
    },
    onSearchResultsEndIntersect (entries) {
      if (entries[0].isIntersecting) {
        this.fetchMoreResults()
      }
    },

    fetchMoreResults () {
      this.$store.dispatch('fetchJson', {
        path: '/nextpage/search',
        params: {
          nextpage: this.results.nextpage,
          q: this.$route.query.search_query,
          filter: this.selectedFilter
        }
      }).then(json => {
        this.results.nextpage = json.nextpage
        this.results.id = json.id
        this.results.items = this.results.items.concat(json.items.map(this.rationalizeSearchResult))
      })
    }
  }
}
</script>
