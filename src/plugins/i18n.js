import Vue from 'vue'
import VueI18n from 'vue-i18n'

import ENTranslations from '@/translations/en.json'

Vue.use(VueI18n)

const messages = {
  en: ENTranslations
}

export const i18n = new VueI18n({
  locale: 'en', // set default locale
  fallbackLocale: 'en',
  messages
})

async function syncStylesPerLanguage (locale) {
  switch (locale) {
    // All the latin languages
    case 'de':
    case 'en':
    case 'el':
    case 'fr':
    case 'lt':
    case 'ml':
    case 'tr':
    case 'bn_latn':
      // Don't need to import fonts because Latin fonts are always loaded
      document.body.classList.remove(...document.body.classList)
      document.body.classList.add('latin')
      break
    // Bengali script
    case 'bn_beng':
      await import('@fontsource/baloo-da-2/bengali.css')
      document.body.classList.remove(...document.body.classList)
      document.body.classList.add('bengali')
      break
    // Chinese languages
    case 'zh_Hant':
      // NOTE: if you are Chinese and want to see a different font, just email me
      document.body.classList.remove(...document.body.classList)
      document.body.classList.add('chinese')
  }
}

export async function loadLocale (locale) {
  if (i18n.availableLocales.includes(locale)) {
    return
  }
  // load locale messages with dynamic import
  const messages = await import(/* webpackChunkName: "locale-[request]" */ `@/translations/${locale}.json`)

  // set locale and locale message
  i18n.setLocaleMessage(locale, messages.default)

  return Vue.nextTick()
}

export async function changeLocale (lang) {
  await loadLocale(lang)
  await syncStylesPerLanguage(lang)
  i18n.locale = lang
  window.localStorage.setItem('LOCALE', lang)
}

function initializeLocalLocale () {
  const lang = window.localStorage.getItem('LOCALE')
  if (lang != null) {
    changeLocale(lang).catch(e => console.error(e))
  }
}

initializeLocalLocale()
