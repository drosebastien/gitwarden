<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { getCurrentUser } from '@/services/gitlab/api'

const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.accessToken) {
    return
  }

  try {
    const user = await getCurrentUser(authStore.accessToken)

    authStore.setUser(user)
  } catch {
    authStore.logout()
  }
})
</script>

<template>
  <RouterView />
</template>
