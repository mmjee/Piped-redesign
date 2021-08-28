<template>
  <v-autocomplete
    v-model="select"
    :loading="requestInProgress"
    :items="searchSuggestions"
    :search-input.sync="searchText"
    cache-items
    class="mx-4"
    flat
    dense
    hide-no-data
    hide-details
    :label="$t('misc.searchBarLabel')"
    solo-inverted
  ></v-autocomplete>
</template>

<script>
export default {
  name: 'SearchMenu',
  data () {
    return {
      selected: 0,
      select: '',
      searchText: '',
      requestInProgress: false,
      searchSuggestions: []
    }
  },
  watch: {
    searchText (val) {
      if (val && val !== this.select) {
        this.refreshSuggestions()
      }
    },

    async select (val) {
      if (val === '') {
        return
      }
      try {
        await this.$router.push({
          name: 'SearchResults',
          query: { search_query: val }
        })
      } catch (e) {
        console.log('???', e)
      } finally {
        this.select = ''
        this.searchText = ''
      }
    }
  },

  methods: {
    async refreshSuggestions () {
      this.requestInProgress = true
      this.searchSuggestions = await this.$store.dispatch('fetchJson', {
        path: '/suggestions',
        params: {
          query: this.searchText
        }
      })
      this.searchSuggestions.unshift(this.searchText)
      this.requestInProgress = false
    }
  }
}
</script>
