<template>
  <v-container fluid>
    <h1 class="text-h4 text-center">{{ $t('titles.preferences') }}</h1>
    <v-divider class="ma-4" />
    <div style="display: flex;" v-for="(opt, optId) in options" :key="optId">
      <v-simple-checkbox v-if="opt.type === 'bool'" :value="$store.getters.getPreferenceBoolean(opt.id, opt.default)" @input="setValue(opt.id, $event)" />
      <v-select v-else-if="opt.type === 'select'" :label="$t('preferences.' + opt.id)" :value="$store.getters.getPreferenceString(opt.id, opt.default)" @input="setValue(opt.id, $event)" :items="opt.options" />
      <p v-if="opt.type === 'bool'">{{ $t('preferences.' + opt.id) }}</p><br />
    </div>
    <h5 class="text-h5">{{ $t('actions.instances_list') }}</h5>
    <v-data-table :headers="tableHeaders" :items="instances" />
  </v-container>
</template>

<script>
import CountryMap from '@/tools/CountryMap'

export default {
  data () {
    return {
      instances: [],
      countryMap: CountryMap.COUNTRIES,

      options: [
        {
          id: 'playerAutoplay',
          type: 'bool',
          default: true
        },
        {
          id: 'listen',
          type: 'bool',
          default: false
        },
        {
          id: 'quality',
          type: 'select',
          default: 0,
          options: [
            {
              text: 'Auto',
              value: 0
            },
            ...([144, 240, 360, 480, 720, 1080, 1440, 2160, 4320].map(i => ({
              text: i.toString() + 'p',
              value: i
            })))
          ]
        },
        {
          id: 'region',
          type: 'select',
          label: 'Country',
          default: 'US',
          options: CountryMap.COUNTRIES.map(co => ({
            text: co.name,
            value: co.code
          })).sort((a, b) => {
            return a.text.localeCompare(b.text)
          })
        },
        {
          id: 'homepage',
          type: 'select',
          label: 'Default Homepage',
          options: [
            {
              text: 'Trending',
              value: 'trending'
            },
            {
              text: 'Feed',
              value: 'feed'
            }
          ]
        }
      ],

      tableHeaders: [
        {
          text: 'Name',
          value: 'name'
        },
        {
          text: 'API URL',
          value: 'apiurl'
        },
        {
          text: 'Locations',
          value: 'locations'
        },
        {
          text: 'CDN enabled?',
          value: 'cdn'
        }
      ]
    }
  },
  metaInfo () {
    return {
      title: this.$t('titles.preferences')
    }
  },

  mounted () {
    if (Object.keys(this.$route.query).length > 0) this.$router.replace({ query: {} })

    fetch('https://raw.githubusercontent.com/wiki/TeamPiped/Piped-Frontend/Instances.md')
      .then(resp => resp.text())
      .then(body => {
        let skipped = 0
        const lines = body.split('\n')
        lines.forEach(line => {
          const split = line.split('|')
          if (split.length === 4) {
            if (skipped < 2) {
              skipped++
              return
            }
            this.instances.push({
              name: split[0].trim(),
              apiurl: split[1].trim(),
              locations: split[2].trim(),
              cdn: split[3].trim()
            })
          }
        })
        this.options.push({
          id: 'instance',
          type: 'select',
          default: 'https://pipedapi.kavin.rocks',
          label: 'Instance',
          options: this.instances.map(i => ({
            text: i.name,
            value: i.apiurl
          }))
        })
      })
  },
  methods: {
    setValue (k, v) {
      this.$store.commit('setPrefs', {
        id: k,
        value: v
      })
    },

    sslScore (url) {
      return 'https://www.ssllabs.com/ssltest/analyze.html?d=' + new URL(url).host + '&latest'
    }
  }
}
</script>
