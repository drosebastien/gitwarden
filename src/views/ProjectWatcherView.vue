<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseLayout from '@/components/layout/BaseLayout.vue'
import GitLabGroupInput from '@/components/GitLabGroupInput.vue'
import RepositoryPatternInput from '@/components/RepositoryPatternInput.vue'
import PaeUpdateLabelView from '@/components/PaeUpdateLabelView.vue'
import { usePaeStore } from '@/stores/pae'
import { getGroupsWithStudentCount, getStudents } from '@/domain/pae'
import { useAuthStore } from '@/stores/auth'

const paeStore = usePaeStore()
const authStore = useAuthStore()

onMounted(() => {
  paeStore.load(authStore.accessToken)
})

// ==================================================================
//                        Repositories path
// ==================================================================

const gitlabGroup = ref(null)

function gitLabGroupChanged(group) {
  gitlabGroup.value = group
}

// ==================================================================
//                         Courses & groups
// ==================================================================

const selectedCourse = ref('')
const courses = paeStore.courses

function courseChanged() {}

const selectedGroup = ref('')

const groups = computed(() => getGroupsWithStudentCount(paeStore.pae, selectedCourse.value))
const courseStudents = computed(() => getStudents(paeStore.pae, selectedCourse.value))

// ==================================================================
//                       repositories pattern
// ==================================================================

const repositoryPattern = ref('p-:m:')
const patternIsValid = ref(false)

function patternChanged(v) {
  patternIsValid.value = v
}
</script>

<template>
  <BaseLayout>
    <header>
      <h1>Suivi de projets</h1>
      <p>Suivre l'avancée des projets.</p>
    </header>

    <section>
      <GitLabGroupInput @git-lab-group-selected="gitLabGroupChanged" />
      <p v-if="gitlabGroup">group : {{ gitlabGroup.name }}</p>
    </section>

    <section>
      <h2>2. Étudiants</h2>
      <p>Chargez les matricules depuis le PAE ou saisissez-les directement.</p>

      <PaeUpdateLabelView />
      <template v-if="paeStore.loaded">
        <div>
          <label for="course">Cours</label>

          <select id="course" v-model="selectedCourse" @change="courseChanged">
            <option value="">Sélectionner un cours…</option>

            <option v-for="course in courses" :key="course" :value="course">
              {{ course }}
            </option>
          </select>
        </div>

        <div>
          <label for="student-group">Groupe <small>(optionnel)</small></label>

          <select id="student-group" v-model="selectedGroup" :disabled="!selectedCourse">
            <option value="">Tous les groupes — {{ courseStudents.length }} étudiants</option>

            <option v-for="group in groups" :key="group.name" :value="group.name">
              {{ group.name }} — {{ group.count }} étudiants
            </option>
          </select>
        </div>
      </template>
    </section>

    <section>
      <h2>4. Nom des dépôts</h2>
      <RepositoryPatternInput v-model="repositoryPattern" @validity-changed="patternChanged" />
      <p>{{ repositoryPattern }} / est valide : {{ patternIsValid }}</p>
    </section>
  </BaseLayout>
</template>
