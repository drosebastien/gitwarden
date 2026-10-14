<script setup>
import { ref } from 'vue';
import BaseLayout from '@/components/layout/BaseLayout.vue';
import GitLabGroupInput from '@/components/GitLabGroupInput.vue';

const gitLabGroup = ref(null);

function setGitLabGroup(group) {
  console.log("hello")
  gitLabGroup.value = group;
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
      <GitLabGroupInput @git-lab-group-selected="setGitLabGroup"/>
      <p>group : {{ gitLabGroup.name }}</p>
    </section>
  </BaseLayout>
</template>
