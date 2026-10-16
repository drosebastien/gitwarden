<script setup>
import { ref } from 'vue';
import BaseLayout from '@/components/layout/BaseLayout.vue';
import GitLabGroupInput from '@/components/GitLabGroupInput.vue';
import GitlabProjectNameInput from '@/components/GitlabProjectNameInput.vue';

const gitlabGroup = ref(null);
const isValid = ref(false);

const projectName = ref("project-:m:")


function gitLabGroupChanged(group) {
  gitlabGroup.value = group
}

function patternChanged(v) {
  isValid.value = v
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
      <GitlabProjectNameInput v-model="projectName" @pattern-is-valid="patternChanged"/>
      <p>{{ projectName }} / est valide : {{ isValid }}</p>
    </section>
  </BaseLayout>
</template>
