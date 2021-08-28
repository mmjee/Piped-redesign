<template>
    <v-card link :to="item.url">
      <v-img
        :height="height"
        :width="width"
        :src="item.thumbnail"
        alt="thumbnail"
      />
      <v-card-title class="subtitle-1">{{ item.title }}</v-card-title>
      <v-card-subtitle>{{ item.type }}</v-card-subtitle>
      <v-card-text>
        <router-link :to="item.uploaderUrl" class="subtitle-1 text-decoration-none" v-if="item.uploaderUrl && item.uploaderName && !hideChannel" custom v-slot="{ navigate }">
          <h5 @click="navigate" @keypress.enter="navigate" role="link">{{ item.uploaderName }}</h5>
        </router-link>
        <span v-else-if="item.uploaderName">{{ item.uploaderName }}<br /></span>
        <span v-if="isNumber(item.videos)">{{ $tc('counts.videos', item.videos ) }}</span>
      </v-card-text>
    </v-card>
</template>

<script>
import { isNumber } from 'lodash-es'

export default {
  props: {
    item: Object,
    height: Number,
    width: Number,
    hideChannel: Boolean
  },
  methods: {
    isNumber (...args) {
      return isNumber(...args)
    }
  }
}
</script>
