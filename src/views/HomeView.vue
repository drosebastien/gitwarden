<script setup>
import GitLabLoginButton from '@/components/GitLabLoginButton.vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <main>
    <h1>GitWarden</h1>

    <p>GitLab project management for education.</p>

    <template v-if="authStore.isAuthenticated">
      <p>
        Connecté en tant que
        <strong>{{ authStore.user.name }}</strong>
        (@{{ authStore.user.username }})
      </p>

      <RouterLink to="/create"> Créer des dépôts </RouterLink>
    </template>

    <GitLabLoginButton v-else />
  </main>
</template>
