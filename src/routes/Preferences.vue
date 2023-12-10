<template>
	<v-container style="max-width: 1080px">
		<h1 class="text-h4 text-center">{{ $t('titles.preferences') }}</h1>
		<v-divider class="ma-4" />
		<v-select :label="$t('preferences.colorScheme')" :value="$store.state.prefs.colorScheme"
			@input="$store.commit('prefs/setColorScheme', { colorScheme: $event })" :items="colorSchemeOptions" />
		<div v-for="(opt, optId) in options" :key="optId">
			<v-checkbox v-if="opt.type === 'bool'" dense :label="$t('preferences.' + opt.id)"
				:input-value="$store.getters['prefs/getPreferenceBoolean'](opt.id, opt.default)"
				@change="setValue(opt.id, $event)" />
			<v-text-field v-else-if="opt.type === 'number'" type="number" :label="$t('preferences.' + opt.id)"
				:value="$store.getters['prefs/getPreferenceNumber'](opt.id, opt.default)"
				@input="setValue(opt.id, Number($event))" />
			<v-select v-else-if="opt.type === 'select'" :label="$t('preferences.' + opt.id)"
				:value="$store.getters['prefs/getPreference'](opt.id, opt.default)" :attach="opt.multi" :chips="opt.multi"
				:multiple="opt.multi" :items="opt.options" @input="setValue(opt.id, $event)" />
		</div>
		<v-checkbox dense :label="$t('preferences.custom_instance.button_label')"
			:input-value="$store.getters['prefs/getPreferenceBoolean']('enableCustomInstance', false)"
			@change="setCustomInstanceStatus" />
		<v-text-field v-if="$store.getters['prefs/getPreferenceBoolean']('enableCustomInstance', false)"
			:label="$t('preferences.custom_instance.input_label')"
			:value="$store.getters['prefs/getPreference']('custom_instance_v1')" @input="setValue('custom_instance_v1', $event)" />
		<h5 class="text-h5">{{ $t('actions.instances_list') }}</h5>
		<v-data-table :headers="tableHeaders" :items="instances" :items-per-page="-1">
			<!-- eslint-disable-next-line vue/valid-v-slot -->
			<template v-slot:item.registered="{ item }">
				{{ $store.getters['i18n/fmtFullNumber'](item.registered) }}
			</template>
		</v-data-table>
	</v-container>
</template>

<script>
import { loadCountries } from '@/plugins/i18n'
import { COLOR_SCHEME_STATES } from '@/store/prefs-store'

export default {
	data () {
		return {
			upstreamInstanceList: [],
			countryOptions: null,
			tableHeaders: [
				{
					text: 'Name',
					value: 'name'
				},
				{
					text: 'API URL',
					value: 'api_url'
				},
				{
					text: 'Locations',
					value: 'locations'
				},
				{
					text: 'CDN enabled?',
					value: 'cdn'
				},
				{
					text: 'Registered users',
					value: 'registered'
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
	computed: {
		colorSchemeOptions () {
			return [
				{ text: this.$t('actions.auto'), value: COLOR_SCHEME_STATES.SYSTEM },
				{ text: this.$t('actions.light'), value: COLOR_SCHEME_STATES.LIGHT },
				{ text: this.$t('actions.dark'), value: COLOR_SCHEME_STATES.DARK }
			]
		},
		options () {
			const opts = [
				{
					id: 'playerAutoplay',
					type: 'bool',
					default: true
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
					id: 'homepageButton',
					type: 'bool',
					default: false
				},
				{
					id: 'homepage',
					type: 'select',
					default: 'trending',
					options: [
						{
							text: this.$i18n.t('titles.trending'),
							value: 'trending'
						},
						{
							text: this.$i18n.t('titles.feed'),
							value: 'feed'
						}
					]
				},
				{
					id: 'feedColumns',
					type: 'select',
					default: 4,
					options: [
						{
							text: this.$i18n.t('preferences.column_opts.4'),
							value: 4
						},
						{
							text: this.$i18n.t('preferences.column_opts.5'),
							value: 5
						},
						{
							text: this.$i18n.t('preferences.column_opts.6'),
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
							text: this.$i18n.t('preferences.quality_opts.auto'),
							value: 0
						},
						...([144, 240, 360, 480, 720, 1080, 1440, 2160, 4320].map(i => ({
							text: this.$i18n.t('preferences.quality_opts.' + i.toString() + 'p'),
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
					id: 'disableCommentsByDefault',
					type: 'bool',
					default: false
				},
				{
					id: 'filterOutShortsInFeedPage',
					type: 'bool',
					default: false
				},
				{
					id: 'filterOutShortsInSearchResults',
					type: 'bool',
					default: false
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
					id: 'disableDuplicateHistoryEntries',
					type: 'bool',
					default: false
				},
				{
					id: 'selectedSkip',
					type: 'select',
					multi: true,
					options: [
						{
							text: 'actions.skip_sponsors',
							value: 'sponsor'
						},
						{
							text: 'actions.skip_intro',
							value: 'intro'
						},
						{
							text: 'actions.skip_outro',
							value: 'outro'
						},
						{
							text: 'actions.skip_preview',
							value: 'preview'
						},
						{
							text: 'actions.skip_interaction',
							value: 'interaction'
						},
						{
							text: 'actions.skip_self_promo',
							value: 'selfpromo'
						},
						{
							text: 'actions.skip_non_music',
							value: 'music_offtopic'
						},
						{
							text: 'actions.skip_poi_highlights',
							value: 'poi_highlight'
						},
						{
							text: 'actions.skip_filler',
							value: 'filler'
						}
					].map(o => {
						o.text = this.$i18n.t(o.text)
						return o
					})
				},
				{
					id: 'codecs',
					type: 'select',
					multi: true,
					options: [
						{
							text: 'preferences.codec_options.av01',
							value: 'av01'
						},
						{
							text: 'preferences.codec_options.avc1',
							value: 'avc1'
						},
						{
							text: 'preferences.codec_options.vp9',
							value: 'vp9'
						}
					].map(o => {
						o.text = this.$i18n.t(o.text)
						return o
					})
				}
			]

			if (this.countryOptions != null) {
				opts.push(this.countryOptions)
			}

			opts.push({
				id: 'instance',
				type: 'select',
				default: this.$store.getters['prefs/apiUrl'],
				label: 'Instance',
				options: this.instances.map(i => ({
					text: i.name,
					value: i.api_url
				}))
			})

			return opts
		},
		instances () {
			const instanceURLSet = new Set()

			const instances = this.upstreamInstanceList.map((v) => {
				try {
					v._locations = v.locations.split(',')
				} catch (e) {
					v._locations = []
					console.error('Error while parsing locations:', v.locations)
				}
				v._cdn = v.cdn
				v.cdn = v._cdn === true ? '✔️' : '❌'
				instanceURLSet.add(v.api_url)
				return v
			})

			const customInstance = this.$store.getters['prefs/getPreference']('custom_instance_v1')
			if (customInstance != null && customInstance.length !== 0 && !instanceURLSet.has(customInstance)) {
				try {
					const u = new URL(customInstance)
					instances.push({
						name: u.hostname,
						api_url: customInstance,
						locations: '???',
						_locations: [],
						registered: -1,
						cdn: '???',
						_cdn: false
					})
					instanceURLSet.add(customInstance)
				} catch (e) {
					console.error('Caught error while parsing custom instance URL, skipping:', e)
				}
			}

			const currentInstance = this.$store.getters['prefs/apiUrl']
			if (!instanceURLSet.has(currentInstance)) {
				const u = new URL(currentInstance)

				instances.push({
					name: u.hostname,
					api_url: currentInstance,
					locations: '???',
					_locations: [],
					registered: -1,
					cdn: '???',
					_cdn: false
				})
				instanceURLSet.add(currentInstance)
			}

			const vapu = process.env.VUE_APP_PIPED_URL
			if (!instanceURLSet.has(vapu)) {
				const u = new URL(vapu)

				instances.push({
					name: u.hostname,
					api_url: vapu,
					locations: '???',
					_locations: [],
					registered: -1,
					cdn: '???',
					_cdn: false
				})
				instanceURLSet.add(vapu)
			}

			instances.sort((a, b) => this.$store.getters['i18n/compare'](a.name, b.name))
			instances.sort((a, b) => b.registered - a.registered)
			instances.sort((a, b) => ((a._cdn === b._cdn) ? 0 : a._cdn ? 1 : -1))
			instances.sort((a, b) => {
				return b._locations.length - a._locations.length
			})

			return instances
		}
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
			const locale = this.$store.state.i18n.locale
			const [Countries, LocalizedNames] = await loadCountries(locale)
			Countries.registerLocale(LocalizedNames)
			this.countryOptions = {
				id: 'region',
				type: 'select',
				label: 'Country',
				default: this.$store.getters['prefs/getPreference']('region', this.$store.state.i18n.parsed.region ?? 'US'),
				options: Object.entries(Countries.getNames(LocalizedNames.locale, { select: 'official' }))
					.sort((a, b) => this.$store.getters['i18n/compare'](a[1], b[1]))
					.map(([code, name]) => ({
						text: name,
						value: code
					}))
			}
		},

		async getInstances () {
			const resp = await fetch(process.env.VUE_APP_PIPED_INSTANCES_API ?? 'https://piped-instances.kavin.rocks/', {
				referrerPolicy: 'no-referrer'
			}).then(resp => resp.json())

			this.upstreamInstanceList = resp
		},

		setValue (k, v) {
			this.$store.commit('prefs/setPrefs', {
				id: k,
				value: v
			})
		},

		setCustomInstanceStatus (ev) {
			if (ev === false) {
				this.setValue('custom_instance_v1', null)
			}
			this.setValue('enableCustomInstance', ev)
		},

		sslScore (url) {
			return 'https://www.ssllabs.com/ssltest/analyze.html?d=' + new URL(url).host + '&latest'
		}
	}
}
</script>
