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

    console.log('OAuth callback')
    console.log('code:', code)
    console.log('state:', state)

    if (!code) {
      throw new Error('Code OAuth GitLab manquant')
    }

    const expectedState = sessionStorage.getItem('gitlab_oauth_state')

    console.log('expected state:', expectedState)

    if (!state || state !== expectedState) {
      throw new Error('État OAuth invalide')
    }

    sessionStorage.removeItem('gitlab_oauth_state')

    console.log('Exchanging code...')

    const tokens = await exchangeCodeForToken(code)

    console.log('Token received:', !!tokens.access_token)

    const user = await getCurrentUser(tokens.access_token)

    console.log('User:', user.username)

    authStore.login(user, tokens)

    console.log(
      'Stored token:',
      !!sessionStorage.getItem('gitlab_access_token'),
    )

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
