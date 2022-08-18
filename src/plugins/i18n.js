import Vue from 'vue'
import VueI18n from 'vue-i18n'
import TimeAgo from 'javascript-time-ago'
import * as LocaleMatcher from '@formatjs/intl-localematcher'

import { EDS } from '@/plugins/eds'
import store from '@/store'
import ENTranslations from '@/translations/en.json'
import ENTimeAgo from 'javascript-time-ago/locale/en.json'

Vue.use(VueI18n)
TimeAgo.addLocale(ENTimeAgo)

const messages = {
	en: ENTranslations
}

export const SUPPORTED_LANGUAGES = [
	'az',
	'en',
	'fr',
	'de',
	'el',
	'es',
	'id',
	'it',
	'zh-Hans',
	'zh-Hant',
	'cs',
	'ja',
	'ko',
	'ru',
	'lt',
	'ml',
	'nb-NO',
	'tr',
	'pt-BR',
	'bn',
	'bn-IN',
	'ar',
	'ckb',
	'hr',
	'nl',
	'sr',
	'bs',
	'uk',
	'ro'
]

export const i18n = new VueI18n({
	locale: 'en', // set default locale
	fallbackLocale: 'en',
	messages
})

export const DEPRECATED_LANGUAGES_MAP = new Map([
	['bn-Beng', 'bn-IN']
])

export const TIME_AGO_EXCEPTIONS = {
	'bn-IN': 'bn',
	'nb-NO': 'nb',
	'zh-Hans': 'zh',
	ckb: 'ku',
	'pt-BR': 'pt'
}

const TIME_AGO_LOADED = {
	en: true
}

export const COUNTRY_I18N_EXCEPTIONS = {
	'bn-IN': 'bn',
	ckb: 'ku',
	'nb-NO': 'nb',
	'zh-Hant': 'zh',
	'zh-Hans': 'zh',
	'pt-BR': 'pt'
}

// Similar switches for RTL can be found in the i18n store
async function syncStylesPerLanguage (locale) {
	document.documentElement.setAttribute('lang', locale)
	switch (locale) {
		// All the Inter-based languages
		case 'az':
		case 'cs':
		case 'de':
		case 'en':
		case 'el':
		case 'es':
		case 'id':
		case 'fr':
		case 'lt':
		case 'ml':
		case 'tr':
		case 'pt-BR':
		case 'ru':
		case 'hr':
		case 'nb-NO':
		case 'nl':
		case 'sr':
		case 'bs':
		case 'uk':
		case 'ro':
		case 'it':
			// Don't need to import fonts because Inter supports Latin and Cyrillic and is always loaded
			document.body.classList.remove(...document.body.classList)
			document.body.classList.add('default-font')
			break
		// Bengali script
		case 'bn':
		case 'bn-IN':
			await import('@fontsource/baloo-da-2/bengali.css')
			document.body.classList.remove(...document.body.classList)
			document.body.classList.add('bengali')
			break
		// Other languages
		// NOTE: if you are a native speaker & want to see a different font, just email me or join the channel
		case 'ar':
		case 'ckb':
			await import('@fontsource/noto-naskh-arabic/arabic.css')
			document.body.classList.remove(...document.body.classList)
			document.body.classList.add('arabic-script')
			break
		case 'zh-Hant':
			await import('@fontsource/noto-sans-tc/chinese-traditional.css')
			document.body.classList.remove(...document.body.classList)
			document.body.classList.add('traditional-chinese')
			break
		case 'zh-Hans':
			await import('@fontsource/noto-sans-sc/chinese-simplified.css')
			document.body.classList.remove(...document.body.classList)
			document.body.classList.add('simplified-chinese')
			break
		case 'ja':
			await import('@fontsource/noto-sans-jp/japanese.css')
			document.body.classList.remove(...document.body.classList)
			document.body.classList.add('japanese')
			break
		case 'ko':
			await import('@fontsource/noto-sans-kr/korean.css')
			document.body.classList.remove(...document.body.classList)
			document.body.classList.add('korean')
			break
		default:
			throw new Error('Invalid language')
	}
}

export async function loadLocale (locale) {
	if (i18n.availableLocales.includes(locale)) {
		return
	}
	// load locale messages with dynamic import
	const messages = await import(/* webpackChunkName: "translations-[request]" */ `@/translations/${locale}.json`)

	// set locale and locale message
	i18n.setLocaleMessage(locale, messages.default)

	return Vue.nextTick()
}

async function loadFormatting (locale) {
	const tal = TIME_AGO_EXCEPTIONS[locale] ?? locale
	if (!TIME_AGO_LOADED[tal]) {
		const data = await import(/* webpackChunkName: "timeago-[request]" */ `javascript-time-ago/locale/${tal}.json`)
		TimeAgo.addLocale(data)
		TIME_AGO_LOADED[tal] = true
	}
	const timeAgo = new TimeAgo(tal, {
		polyfill: false
	})

	store.commit('i18n/updateState', {
		intlLocale: locale,
		timeAgo
	})
}

export async function changeLocale (lang) {
	if (DEPRECATED_LANGUAGES_MAP.has(lang)) {
		lang = DEPRECATED_LANGUAGES_MAP.get(lang)
	}
	await Promise.all([
		loadLocale(lang),
		syncStylesPerLanguage(lang),
		loadFormatting(lang)
	])
	i18n.locale = lang
	await EDS.setKey('locale', lang)
}

export async function initializeLocalLocale () {
	let lang = await EDS.getKey('locale')
	if (lang == null) {
		lang = LocaleMatcher.match(navigator.languages, SUPPORTED_LANGUAGES, 'en')
	}
	return changeLocale(lang)
}
