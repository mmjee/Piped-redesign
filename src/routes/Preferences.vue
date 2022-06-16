<template>
  <v-container style="max-width: 1080px">
    <h1 class="text-h4 text-center">{{ $t('titles.preferences') }}</h1>
    <v-divider class="ma-4" />
    <div v-for="(opt, optId) in options" :key="optId">
      <v-checkbox
        v-if="opt.type === 'bool'"
        dense
        :label="$t('preferences.' + opt.id)"
        :input-value="$store.getters['prefs/getPreferenceBoolean'](opt.id, opt.default)"
        @change="setValue(opt.id, $event)"
      />
      <v-text-field
        v-else-if="opt.type === 'number'"
        type="number"
        :label="$t('preferences.' + opt.id)"
        :value="$store.getters['prefs/getPreferenceNumber'](opt.id, opt.default)"
        @input="setValue(opt.id, Number($event))"
      />
      <v-select
        v-else-if="opt.type === 'select'"
        :label="$t('preferences.' + opt.id)"
        :value="$store.getters['prefs/getPreference'](opt.id, opt.default)"
        :attach="opt.multi"
        :chips="opt.multi"
        :multiple="opt.multi"
        :items="opt.options"
        @input="setValue(opt.id, $event)"
      />
    </div>
    <h5 class="text-h5">{{ $t('actions.instances_list') }}</h5>
    <v-data-table :headers="tableHeaders" :items="instances" :items-per-page="-1" />
  </v-container>
</template>

<script>
import { COUNTRY_I18N_EXCEPTIONS } from '@/plugins/i18n'

export default {
	data () {
		return {
			instances: [],

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
					id: 'disableLBRY',
					type: 'bool',
					default: true
				},
				{
					id: 'proxyLBRY',
					type: 'bool',
					default: true
				},
				{
					id: 'skipToLastPoint',
					type: 'bool',
					default: true
				},
				{
					id: 'clickbaitThumbnailAvoidance',
					type: 'bool',
					default: false
				},
				{
					id: 'homepage',
					type: 'select',
					label: 'Default Homepage',
					default: 'trending',
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
				},
				{
					id: 'feedColumns',
					type: 'select',
					label: 'Amount of Columns on Feed Pages',
					default: 4,
					options: [
						{
							text: '4 columns',
							value: 4
						},
						{
							text: '5 columns',
							value: 5
						},
						{
							text: '6 columns',
							value: 6
						}
					]
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
					id: 'bufferGoal',
					type: 'number',
					default: 10
				},
				{
					id: 'sponsorblock',
					type: 'bool',
					default: true
				},
				{
					id: 'showComments',
					type: 'bool',
					default: true
				},
				{
					id: 'showRelatedVideos',
					type: 'bool',
					default: true
				},
				{
					id: 'showMarkers',
					type: 'bool',
					default: true
				},
				{
					id: 'selectedSkip',
					type: 'select',
					label: 'Selected Segments to Skip',
					multi: true,
					options: [
						{ text: 'actions.skip_sponsors', value: 'sponsor' },
						{ text: 'actions.skip_intro', value: 'intro' },
						{ text: 'actions.skip_outro', value: 'outro' },
						{ text: 'actions.skip_preview', value: 'preview' },
						{ text: 'actions.skip_interaction', value: 'interaction' },
						{ text: 'actions.skip_self_promo', value: 'selfpromo' },
						{ text: 'actions.skip_non_music', value: 'music_offtopic' },
						{ text: 'actions.skip_poi_highlights', value: 'poi_highlight' },
						{ text: 'actions.skip_filler', value: 'filler' }
					].map(o => {
						o.text = this.$i18n.t(o.text)
						return o
					})
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
	watch: {
		'$i18n.locale': 'getCountries'
	},
	mounted () {
		if (Object.keys(this.$route.query).length > 0) this.$router.replace({ query: {} })
		Promise.all([
			this.getInstances(),
			this.getCountries()
		])
	},
	methods: {
		async getCountries () {
			const locale = COUNTRY_I18N_EXCEPTIONS[this.$i18n.locale] || this.$i18n.locale
			const [Countries, LocalizedNames] = await Promise.all([
				import('i18n-iso-countries'),
				import(/* webpackChunkName: "countries-[request]" */ `i18n-iso-countries/langs/${locale}.json`)
			])
			Countries.registerLocale(LocalizedNames)
			this.options = this.options.filter(x => x.id !== 'region')
			this.options.push({
				id: 'region',
				type: 'select',
				label: 'Country',
				default: 'US',
				options: Object.entries(Countries.getNames(locale, { select: 'official' })).map(([code, name]) => ({
					text: name,
					value: code
				}))
			})
		},

		getInstances () {
			fetch('https://raw.githubusercontent.com/wiki/TeamPiped/Piped-Frontend/Instances.md')
				.then(resp => resp.text())
				.then(body => {
					let skipped = 0
					const lines = body.split('\n')
					lines.forEach(line => {
						const split = line.split('|')
						if (split.length === 5) {
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
					if (process.env.VUE_APP_PIPED_URL && this.instances.indexOf(process.env.VUE_APP_PIPED_URL) === -1) {
						const u = new URL(process.env.VUE_APP_PIPED_URL)

						this.instances.push({
							name: u.hostname,
							apiurl: process.env.VUE_APP_PIPED_URL,
							locations: '???',
							cdn: '???'
						})
					}
					this.options.push({
						id: 'instance',
						type: 'select',
						default: this.$store.getters['prefs/apiUrl'],
						label: 'Instance',
						options: this.instances.map(i => ({
							text: i.name,
							value: i.apiurl
						}))
					})
				})
		},

		setValue (k, v) {
			this.$store.commit('prefs/setPrefs', {
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
