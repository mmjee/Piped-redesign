<template>
  <v-app id="inspire">
    <v-app-bar
      app
      color="primary"
      dark
    >
      <!-- Someone help me fix this horrid design -->
      <v-container class="py-2 fill-height">
        <v-row>
          <v-col md="1"
                 v-for="link in links"
                 :key="link.id"
          >
            <v-btn
              text
              link
              min-width="100%"
              :to="link.to"
            >
              {{ link.name }}
            </v-btn>
          </v-col>
          <v-col md="1" offset="3">
            <v-select
              dense
              :items="languageOptions"
              label="Language"
              :value="$i18n.locale"
              @input="changeLocale($event)"
              outlined
            />
          </v-col>
          <v-col md="5">
            <SearchMenu />
          </v-col>
        </v-row>
      </v-container>
    </v-app-bar>

    <v-main class="grey lighten-3">
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import SearchMenu from '@/routes/SearchMenu'
import { changeLocale } from '@/plugins/i18n'

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
    ],
    languageOptions: [
      {
        text: 'English',
        value: 'en'
      }
    ]
  }),

  methods: {
    changeLocale (lang) {
      return changeLocale(lang.value)
    }
  },
  created () {
    this.$store.dispatch('loadState')
  }
}
</script>
