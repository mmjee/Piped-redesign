import Vue from 'vue'
import VueRouter from 'vue-router'
import VueMeta from 'vue-meta'

import TrendingPage from '@/routes/TrendingPage'
import Preferences from '@/routes/Preferences'

Vue.use(VueMeta)
Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Trending',
    component: TrendingPage
  },
  {
    path: '/preferences',
    name: 'Preferences',
    component: Preferences
  },
  {
    path: '/results',
    name: 'SearchResults',
    component: () => import('@/routes/SearchResults')
  },
  {
    path: '/playlist',
    name: 'Playlist',
    component: () => import('@/routes/Playlist')
  },
  {
    path: '/:path(v|w|embed|shorts|watch)/:v?',
    name: 'WatchVideo',
    component: () => import('@/routes/WatchVideo')
  },
  {
    path: '/:path(channel|user|c)/:channelId/:videos?',
    name: 'Channel',
    component: () => import('@/routes/Channel')
  },
  {
    path: '/:videoId([a-zA-Z0-9_-]{11})',
    component: () => import('@/components/VideoRedirect')
  },
  {
    path: '/watch-history',
    component: () => import('@/routes/WatchHistory')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
