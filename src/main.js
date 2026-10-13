// import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const params = new URLSearchParams(window.location.search)

if (params.has('code') && !window.location.hash) {
  window.location.hash = '/auth/gitlab/callback'
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
