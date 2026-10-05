import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  const accessToken = ref(sessionStorage.getItem('gitlab_access_token'))

  const isAuthenticated = computed(() => {
    return accessToken.value !== null
  })

  function login(userData, tokens) {
    user.value = userData
    accessToken.value = tokens.access_token

    sessionStorage.setItem('gitlab_access_token', tokens.access_token)

    sessionStorage.setItem('gitlab_refresh_token', tokens.refresh_token)

    const expiresAt = Date.now() + tokens.expires_in * 1000

    sessionStorage.setItem('gitlab_expires_at', expiresAt.toString())
  }

  function logout() {
    user.value = null
    accessToken.value = null

    sessionStorage.removeItem('gitlab_access_token')
    sessionStorage.removeItem('gitlab_refresh_token')
    sessionStorage.removeItem('gitlab_expires_at')
  }

  function setUser(userData) {
    user.value = userData
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    login,
    logout,
    setUser,
  }
})
