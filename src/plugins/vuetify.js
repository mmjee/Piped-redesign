import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import colors from 'vuetify/es5/util/colors'

Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: colors.deepPurple.base,
        secondary: colors.purple.base,
        accent: colors.pink.base,
        error: colors.red.base,
        warning: colors.deepOrange.base,
        info: colors.blue.base,
        success: colors.green.base
      }
    }
  }
})
