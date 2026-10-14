<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { exchangeCodeForToken } from '@/services/gitlab/auth'
import { getCurrentUser } from '@/services/gitlab/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const error = ref(null)

onMounted(async () => {
  try {
    const params = new URLSearchParams(window.location.search)

    const code = params.get('code')
    const state = params.get('state')

    if (!code) {
      throw new Error('Code OAuth GitLab manquant')
    }

    const expectedState = sessionStorage.getItem('gitlab_oauth_state')

    if (!state || state !== expectedState) {
      throw new Error('État OAuth invalide')
    }

    sessionStorage.removeItem('gitlab_oauth_state')


    const tokens = await exchangeCodeForToken(code)

    const user = await getCurrentUser(tokens.access_token)

    authStore.login(user, tokens)

    await router.replace('/')
  } catch (e) {
    console.error('OAuth error:', e)

    error.value = 'Impossible de terminer la connexion avec GitLab.'
  }
})
</script>

<template>
  <main>
    <p v-if="!error">Connexion à GitLab…</p>

    <p v-else>
      {{ error }}
    </p>
  </main>
</template>
