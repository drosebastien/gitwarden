<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseLayout from '@/components/layout/BaseLayout.vue'
import GitLabGroupInput from '@/components/GitLabGroupInput.vue'
import RepositoryPatternInput from '@/components/RepositoryPatternInput.vue'
import PaeUpdateLabelView from '@/components/PaeUpdateLabelView.vue'
import { usePaeStore } from '@/stores/pae'
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
const selectedGroup = ref('')

const courseStudents = computed(() => paeStore.getStudents(selectedCourse.value))
const courseGroupsWithStudentCount = computed(() =>
  paeStore.getCourseGroupsWithStudentCount(selectedCourse.value),
)

function courseChanged() {
  selectedGroup.value = ''
}

// ==================================================================
//                       repositories pattern
// ==================================================================

const repositoryPattern = ref('projet-g{m}')
const patternIsValid = ref(false)

function patternChanged(isValid) {
  patternIsValid.value = isValid
}

// ==================================================================
//                            students
// ==================================================================

const studentsText = ref('')

const studentsRaw = computed(() => {
  return [
    ...new Set(
      studentsText.value
        .split(/[\s,;]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ]
})

const students = computed(() => studentsRaw.value.filter((v) => /^\d{5}$/.test(v)))
const invalidStudents = computed(() => studentsRaw.value.filter((v) => !/^\d{5}$/.test(v)))

const selectedPaeStudents = computed(() =>
  paeStore.getStudents(selectedCourse.value, selectedGroup.value || null),
)

function loadStudentsFromPae() {
  studentsText.value = selectedPaeStudents.value.join('\n')
}

function studentsChanged() {}
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

            <option v-for="course in paeStore.courses" :key="course" :value="course">
              {{ course }}
            </option>
          </select>
        </div>

        <div>
          <label for="student-group">Groupe <small>(optionnel)</small></label>

          <select id="student-group" v-model="selectedGroup" :disabled="!selectedCourse">
            <option value="">Tous les groupes — {{ courseStudents.length }} étudiants</option>

            <option
              v-for="group in courseGroupsWithStudentCount"
              :key="group.name"
              :value="group.name"
            >
              {{ group.name }} — {{ group.count }} étudiants
            </option>
          </select>
        </div>
        <div>
          <button type="button" :disabled="!selectedCourse" @click="loadStudentsFromPae">
            Charger les matricules
          </button>
        </div>
        <div>
          <label for="students">Matricules</label>

          <textarea
            id="students"
            v-model="studentsText"
            rows="12"
            placeholder="60192;13041,13123 14123&#10;60990&#10;60991&#10;60992"
            @input="studentsChanged"
          />

          <p>
            <strong>{{ students.length }}</strong> étudiant(s) dans la liste.
          </p>
          <div v-if="invalidStudents.length">
            ⚠️ Certaines entrées sont invalides et seront ignorées. Un matricule doit contenir
            exactement 5 chiffres, par exemple 61234.
            <ul>
              <li v-for="student in invalidStudents" :key="student">
                {{ student }}
              </li>
            </ul>
          </div>
        </div>
      </template>
    </section>

    <section>
      <h2>4. Nom des dépôts</h2>
      <RepositoryPatternInput v-model="repositoryPattern" @validity-changed="patternChanged" />
    </section>
  </BaseLayout>
</template>
