<script setup>
import { ref } from 'vue';
import BaseLayout from '@/components/layout/BaseLayout.vue';
import GitLabGroupInput from '@/components/GitLabGroupInput.vue';
import RepositoryPatternInput from '@/components/RepositoryPatternInput.vue';

const gitlabGroup = ref(null);

const projectName = ref("p-:m:")
const patternIsValid = ref(false);

function gitLabGroupChanged(group) {
  gitlabGroup.value = group
}

function patternChanged(v) {
  patternIsValid.value = v
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
    <section>
      <RepositoryPatternInput v-model="projectName" @validity-changed="patternChanged"/>
      <p>{{ projectName }} / est valide : {{ patternIsValid }}</p>
    </section>
  </BaseLayout>
</template>
