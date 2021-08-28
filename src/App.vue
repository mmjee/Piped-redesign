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
          <v-col md="6">
            <v-btn
              text
              link
              v-for="link in links"
              :key="link.id"
              :to="link.to"
              class="mr-1"
            >
              {{ $t(link.name) }}
            </v-btn>
          </v-col>
          <v-col md="1">
            <v-select
              dense
              :items="languageOptions"
              label="Language"
              :value="$i18n.locale"
              @input="changeLocale"
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
  metaInfo () {
    return {
      title: this.$t('titles.homepage'),
      // all titles will be injected into this template
      titleTemplate: '%s - Piped'
    }
  },

  data: () => ({
    links: [
      {
        id: 'prefs',
        name: 'titles.preferences',
        to: '/preferences'
      },
      {
        id: 'trending',
        name: 'titles.trending',
        to: '/'
      },
      {
        id: 'watch-history',
        name: 'titles.history',
        to: '/watch-history'
      }
    ],
    languageOptions: [
      { value: 'zh_Hant', text: 'Chinese (Traditional)' },
      { value: 'en', text: 'English' },
      { value: 'fr', text: 'French' },
      { value: 'de', text: 'German' },
      { value: 'el', text: 'Greek' },
      { value: 'lt', text: 'Lithuanian' },
      { value: 'ml', text: 'Malayalam' },
      { value: 'nb_NO', text: 'Norwegian Bokmål' },
      { value: 'tr', text: 'Turkish' },
      { value: 'bn_beng', text: 'Bengali (বাংলা)' }
      // Incomplete, DO NOT USE
      /* { value: 'bn_latn', text: 'Bengali (Latin)' }, */
    ].sort((a, b) => {
      return a.text.localeCompare(b.text)
    })
  }),

  methods: {
    changeLocale (lang) {
      return changeLocale(lang)
    }
  },
  created () {
    this.$store.dispatch('loadState')
  }
}
</script>
