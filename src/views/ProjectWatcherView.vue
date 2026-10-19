<script setup>
import { ref, onMounted } from 'vue';
import BaseLayout from '@/components/layout/BaseLayout.vue';
import GitLabGroupInput from '@/components/GitLabGroupInput.vue';
import RepositoryPatternInput from '@/components/RepositoryPatternInput.vue';
import PaeUpdateLabelView from './PaeUpdateLabelView.vue';
import { usePaeStore } from '@/stores/pae';
import { useAuthStore } from '@/stores/auth';

const paeStore = usePaeStore()
const authStore = useAuthStore()

onMounted(() => {
  paeStore.load(authStore.accessToken)
})

const gitlabGroup = ref(null);

const repositoryPattern = ref("p-:m:")
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
      <h2>2. Étudiants</h2>
      <p>Chargez les matricules depuis le PAE ou saisissez-les directement.</p>

      <PaeUpdateLabelView />

    </section>

    <section>
      <h2>4. Nom des dépôts</h2>
      <RepositoryPatternInput v-model="repositoryPattern" @validity-changed="patternChanged"/>
      <p>{{ repositoryPattern }} / est valide : {{ patternIsValid }}</p>
    </section>

  </BaseLayout>
</template>
