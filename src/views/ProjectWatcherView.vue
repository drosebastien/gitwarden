<script setup>
import { ref } from 'vue';
import BaseLayout from '@/components/layout/BaseLayout.vue';
import GitLabGroupInput from '@/components/GitLabGroupInput.vue';

const gitlabGroup = ref(null);

function gitLabGroupChanged(group) {
  gitlabGroup.value = group
}

</script>

<template>
  <BaseLayout>
    <header>
      <h1> Suivi de projets</h1>
      <p>
        Suivre l'avancée des projets.
      </p>
    </header>
    <section>
      <GitLabGroupInput @git-lab-group-selected="gitLabGroupChanged"/>
      <p v-if="gitlabGroup">group : {{ gitlabGroup.name }}</p>
    </section>
  </BaseLayout>
</template>
