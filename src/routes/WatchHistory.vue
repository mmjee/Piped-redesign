<template>
  <v-progress-linear height="1vh" indeterminate />
</template>

<script>
import { getWatchedVideos } from '@/store/watched-videos-db'

export default {
  data: () => ({
    loaded: false,
    data: null
  }),

  methods: {
    async loadData () {
      this.data = await getWatchedVideos()
      this.loaded = true
    }
  },

  mounted () {
    this.loadData().catch(e => console.error(e))
  }
}
</script>
