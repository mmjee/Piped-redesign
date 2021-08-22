<template>
    <v-card link :to="video.url">
      <v-img
        :height="height"
        :width="width"
        :src="video.thumbnail || video.thumbnailUrl"
        alt="thumbnail"
        loading="lazy"
      />
      <v-card-title class="subtitle-1">{{ video.title }}</v-card-title>
      <v-card-text>
        <router-link :to="video.uploaderUrl" class="subtitle-1 text-decoration-none" v-if="video.uploaderUrl && (video.uploaderName || video.uploader) && !hideChannel" custom v-slot="{ navigate }">
          <h5 @click="navigate" @keypress.enter="navigate" role="link">{{ video.uploaderName || video.uploader }}</h5>
        </router-link>
        <slot />
        {{ numberFormat(video.views) }} views <br />
        {{ video.uploadedDate }} <br />
        {{ timeFormat(video.duration) }}
      </v-card-text>
    </v-card>
</template>

<script>
import { LibPiped } from '@/tools/libpiped'

export default {
  props: {
    video: Object,
    height: Number,
    width: Number,
    hideChannel: Boolean
  },
  methods: {
    numberFormat (...args) {
      return LibPiped.numberFormat(...args)
    },

    timeFormat (...args) {
      return LibPiped.timeFormat(...args)
    }
  }
}
</script>
