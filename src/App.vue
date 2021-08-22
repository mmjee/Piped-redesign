<template>
  <v-app id="inspire">
    <v-app-bar
      app
      color="primary"
      dark
      flat
    >
      <v-container class="py-0 fill-height">
        <v-btn
          v-for="link in links"
          :key="link.id"
          text
          link
          :to="link.to"
        >
          {{ link.name }}
        </v-btn>

        <v-spacer></v-spacer>

        <v-responsive max-width="720">
          <SearchMenu />
        </v-responsive>
      </v-container>
    </v-app-bar>

    <v-main class="grey lighten-3">
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import SearchMenu from '@/routes/SearchMenu'

export default {
  name: 'App',
  components: {
    SearchMenu
  },
  metaInfo: {
    title: 'Homepage',
    // all titles will be injected into this template
    titleTemplate: '%s - Piped'
  },

  data: () => ({
    links: [
      {
        id: 'prefs',
        name: 'Preferences',
        to: '/preferences'
      },
      {
        id: 'trending',
        name: 'Trending',
        to: '/'
      },
      {
        id: 'watch-history',
        name: 'Watch History',
        to: '/watch-history'
      }
    ]
  }),
  created () {
    this.$store.dispatch('loadState')
  }
}
</script>
