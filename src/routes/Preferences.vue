<template>
  <v-container fluid>
    <h1 class="text-h4 text-center">Preferences</h1>
    <v-divider class="ma-4" />
    <div style="display: flex;" v-for="(opt, optId) in options" :key="optId">
      <v-simple-checkbox v-if="opt.type === 'bool'" :value="$store.getters.getPreferenceBoolean(opt.id, opt.default)" @input="setValue(opt.id, $event)" />
      <v-select v-else-if="opt.type === 'select'" :label="opt.label" :value="$store.getters.getPreferenceString(opt.id, opt.default)" @input="setValue(opt.id, $event)" :items="opt.options" />
      <p v-if="opt.type === 'bool'">{{ opt.label }}</p><br />
    </div>
    <h5 class="text-h5">Instances</h5>
    <v-data-table :headers="tableHeaders" :items="instances" />
    <!-- <br />
    <b>Audio Only</b>
    <br />
    <input class="uk-checkbox" v-model="listen" @change="onChange($event)" type="checkbox" />
    <br />
    <b>Default Quality</b>
    <br />
    <select class="uk-select uk-width-auto" v-model="defaultQuality" @change="onChange($event)">
      <option value="0">Auto</option>
      <option :key="resolution" v-for="resolution in resolutions" :value="resolution">{{ resolution }}p</option>
    </select>
    <br />
    <b>Buffering Goal</b>
    <br />
    <input class="uk-input uk-width-auto" v-model="bufferingGoal" @change="onChange($event)" type="text" />
    <br />
    <b>Country Selection</b>
    <br />
    <select class="uk-select uk-width-auto" v-model="country" @change="onChange($event)">
      <option :key="country.code" v-for="country in countryMap" :value="country.code">{{ country.name }}</option>
    </select>
    <br />
    <b>Default Homepage</b>
    <br />
    <select class="uk-select uk-width-auto" v-model="defaultHomepage" @change="onChange($event)">
      <option value="trending">Trending</option>
      <option value="feed">Feed</option>
    </select>
    <br />
    <b>Show Comments</b>
    <br />
    <input class="uk-checkbox" v-model="showComments" @change="onChange($event)" type="checkbox" />
    <h2>Instances List</h2>
    <table class="uk-table">
      <thead>
      <tr>
        <th>Instance Name</th>
        <th>Instance Locations</th>
        <th>Has CDN?</th>
        <th>SSL Score</th>
      </tr>
      </thead>
      <tbody v-bind:key="instance.name" v-for="instance in instances">
      <tr>
        <td>{{ instance.name }}</td>
        <td>{{ instance.locations }}</td>
        <td>{{ instance.cdn }}</td>
        <td>
          <a :href="sslScore(instance.apiurl)" target="_blank">Click Here</a>
        </td>
      </tr>
      </tbody>
    </table>

    <hr />

    <b>Instance Selection:</b>
    <br />
    <select class="uk-select uk-width-auto" v-model="selectedInstance" @change="onChange($event)">
      <option v-bind:key="instance.name" v-for="instance in instances" v-bind:value="instance.apiurl">
        {{ instance.name }}
      </option>
    </select> -->
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
          default: true,
          label: 'Autoplay Video'
        },
        {
          id: 'listen',
          type: 'bool',
          default: false,
          label: 'Audio Only'
        },
        {
          id: 'quality',
          type: 'select',
          label: 'Default resolution',
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
  metaInfo: {
    title: 'Preferences'
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
