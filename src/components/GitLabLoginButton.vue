<script setup>
import { loginWithGitLab } from '@/services/gitlab/auth'

async function login() {
  await loginWithGitLab()
}
</script>

<template>
  <button type="button" @click="login">Se connecter avec GitLab</button>
</template>
