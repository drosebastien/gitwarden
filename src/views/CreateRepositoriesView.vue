<script setup>
import { computed, onMounted, ref } from "vue"

import {
  getCourses,
  getGroupsWithStudentCount,
  getPaeStatus,
  getStudentGroupMap,
  getStudents,
} from "@/domain/pae"
import { getOrCreateSubgroup } from "@/services/gitlab/groups"
import GitLabGroupInput from "@/components/GitLabGroupInput.vue"
import {
  ensureProjectMember,
  getOrCreateProject,
} from "@/services/gitlab/projects"
import { getPaeLastUpdate, loadPae } from "@/services/pae"
import { findStudentGitLabUser } from "@/services/students"
import { useAuthStore } from "@/stores/auth"
import { mapWithConcurrency } from "@/utils/async"
import BaseLayout from "@/components/layout/BaseLayout.vue"

const authStore = useAuthStore()

// ==================================================================
//                            GitLab group
// ==================================================================

const gitlabGroup = ref(null)

function gitLabGroupChanged(group) {
  gitlabGroup.value = group
  resetPreparation()
}

// =============================================================================
// PAE
// =============================================================================

const pae = ref([])
const paeLoading = ref(true)
const paeError = ref("")
const paeLastCommit = ref(null)

onMounted(async () => {
  try {
    const [paeData, lastCommit] = await Promise.all([
      loadPae(authStore.accessToken),
      getPaeLastUpdate(authStore.accessToken),
    ])

    pae.value = paeData
    paeLastCommit.value = lastCommit
  } catch (error) {
    console.error(error)

    paeError.value =
      error.message === "PAE_ACCESS_DENIED"
        ? "Vous n'avez pas accès aux données PAE."
        : "Impossible de charger les données PAE."
  } finally {
    paeLoading.value = false
  }
})

// =============================================================================
// PAE freshness
// =============================================================================

const paeStatus = computed(() => getPaeStatus(paeLastCommit.value))

const formattedPaeLastUpdate = computed(() => {
  if (!paeStatus.value) return ""

  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(paeStatus.value.updateDate)
})

// =============================================================================
// Courses and groups
// =============================================================================

const selectedCourse = ref("")
const selectedGroup = ref("")

const courses = computed(() => getCourses(pae.value))

const groups = computed(() =>
  getGroupsWithStudentCount(pae.value, selectedCourse.value),
)

const courseStudents = computed(() =>
  getStudents(pae.value, selectedCourse.value),
)

const selectedPaeStudents = computed(() =>
  getStudents(pae.value, selectedCourse.value, selectedGroup.value || null),
)

const studentGroupMap = computed(() =>
  getStudentGroupMap(pae.value, selectedCourse.value),
)

function courseChanged() {
  selectedGroup.value = ""
  resetPreparation()
}

// =============================================================================
// Students
// =============================================================================

const studentsText = ref("")

const students = computed(() => {
  return [
    ...new Set(
      studentsText.value
        .split(/[\s,;]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ]
})

function loadStudentsFromPae() {
  studentsText.value = selectedPaeStudents.value.join("\n")
  resetPreparation()
}

function studentsChanged() {
  resetPreparation()
}

// =============================================================================
// Subgroups
// =============================================================================

const createStudentSubgroups = ref(false)

const studentsWithoutGroup = computed(() => {
  if (!createStudentSubgroups.value) return []

  return students.value.filter(
    (matricule) => !studentGroupMap.value.has(matricule),
  )
})

const requiredStudentGroups = computed(() => {
  if (!createStudentSubgroups.value) return []

  return [
    ...new Set(
      students.value
        .map((matricule) => studentGroupMap.value.get(matricule))
        .filter(Boolean),
    ),
  ].sort()
})

function subgroupOptionChanged() {
  resetPreparation()
}

// =============================================================================
// Repository names
// =============================================================================

const repositoryPattern = ref("projet-{m}")

const patternIsValid = computed(() => {
  return (
    repositoryPattern.value.trim() !== "" &&
    repositoryPattern.value.includes("{m}")
  )
})

const repositories = computed(() => {
  if (!patternIsValid.value) return []

  return students.value.map((matricule) => ({
    matricule,
    studentGroup: studentGroupMap.value.get(matricule) ?? null,
    name: repositoryPattern.value.replaceAll("{m}", matricule),
  }))
})

function patternChanged() {
  resetPreparation()
}

// =============================================================================
// Preparation
// =============================================================================

const preparationLoading = ref(false)
const preparationError = ref("")
const preparationResults = ref([])
const preparationCompleted = ref(0)
const preparationTotal = ref(0)

function resetPreparation() {
  preparationResults.value = []
  preparationError.value = ""
  preparationCompleted.value = 0
  preparationTotal.value = 0
  resetCreation()
}

const canPrepare = computed(() => {
  if (!gitlabGroup.value) return false
  if (!students.value.length) return false
  if (!patternIsValid.value) return false

  if (
    createStudentSubgroups.value &&
    studentsWithoutGroup.value.length
  ) {
    return false
  }

  return !preparationLoading.value
})

const preparationProgress = computed(() => {
  if (!preparationTotal.value) return 0

  return Math.round(
    (preparationCompleted.value / preparationTotal.value) * 100,
  )
})

async function prepareCreation() {
  if (!canPrepare.value) return

  resetPreparation()

  preparationLoading.value = true
  preparationTotal.value = repositories.value.length

  try {
    preparationResults.value = await mapWithConcurrency(
      repositories.value,
      10,
      async (repository) => {
        const result = await findStudentGitLabUser(
          authStore.accessToken,
          repository.matricule,
        )

        return {
          matricule: repository.matricule,
          repositoryName: repository.name,
          studentGroup: repository.studentGroup,
          user: result.user,
          usernameType: result.usernameType,
        }
      },
      (completed) => {
        preparationCompleted.value = completed
      },
    )
  } catch (error) {
    console.error(error)
    preparationResults.value = []
    preparationError.value = "Une erreur est survenue pendant la préparation."
  } finally {
    preparationLoading.value = false
  }
}

// =============================================================================
// Preparation summary
// =============================================================================

const preparationDone = computed(() => {
  return preparationResults.value.length > 0 && !preparationLoading.value
})

const studentsWithoutGitLab = computed(() =>
  preparationResults.value.filter((result) => !result.user),
)

const studentsWithFallbackUsername = computed(() =>
  preparationResults.value.filter(
    (result) => result.usernameType === "fallback",
  ),
)

// =============================================================================
// Repository creation
// =============================================================================

const creationLoading = ref(false)
const creationResults = ref([])
const creationCompleted = ref(0)
const creationTotal = ref(0)
const creationError = ref("")

function resetCreation() {
  creationResults.value = []
  creationCompleted.value = 0
  creationTotal.value = 0
  creationError.value = ""
}

const creationProgress = computed(() => {
  if (!creationTotal.value) return 0

  return Math.round(
    (creationCompleted.value / creationTotal.value) * 100,
  )
})

const canCreate = computed(() => {
  return (
    preparationDone.value &&
    preparationResults.value.length > 0 &&
    !creationLoading.value
  )
})

async function createRepositories() {
  if (!canCreate.value) return

  resetCreation()

  creationLoading.value = true
  creationTotal.value = preparationResults.value.length

  try {
    const subgroups = new Map()

    // -------------------------------------------------------------------------
    // Create or retrieve required subgroups
    // -------------------------------------------------------------------------

    if (createStudentSubgroups.value) {
      for (const groupName of requiredStudentGroups.value) {
        const subgroup = await getOrCreateSubgroup(
          authStore.accessToken,
          gitlabGroup.value,
          groupName,
        )

        subgroups.set(groupName, subgroup)
      }
    }

    // -------------------------------------------------------------------------
    // Create or retrieve repositories
    // -------------------------------------------------------------------------

    creationResults.value = await mapWithConcurrency(
      preparationResults.value,
      5,
      async (result) => {
        let project = null
        let projectCreated = false
        let memberAdded = false
        let memberAlreadyPresent = false

        try {
          const namespace = createStudentSubgroups.value
            ? subgroups.get(result.studentGroup)
            : gitlabGroup.value

          const projectResult = await getOrCreateProject(
            authStore.accessToken,
            namespace,
            result.repositoryName,
          )

          project = projectResult.project
          projectCreated = projectResult.created

          // -------------------------------------------------------------------
          // Ensure student membership
          // -------------------------------------------------------------------

          if (result.user) {
            const memberResult = await ensureProjectMember(
              authStore.accessToken,
              project.id,
              result.user.id,
            )

            memberAdded = memberResult.added
            memberAlreadyPresent = !memberResult.added
          }

          return {
            ...result,
            project,
            projectCreated,
            projectAlreadyExists: !projectCreated,
            memberAdded,
            memberAlreadyPresent,
            error: null,
          }
        } catch (error) {
          console.error(error)

          return {
            ...result,
            project,
            projectCreated,
            projectAlreadyExists: project !== null && !projectCreated,
            memberAdded,
            memberAlreadyPresent,
            error: error.message,
          }
        }
      },
      (completed) => {
        creationCompleted.value = completed
      },
    )
  } catch (error) {
    console.error(error)
    creationError.value = error.message
  } finally {
    creationLoading.value = false
  }
}

// =============================================================================
// Creation summary
// =============================================================================

const creationDone = computed(() => {
  return creationResults.value.length > 0 && !creationLoading.value
})

const createdRepositories = computed(() =>
  creationResults.value.filter((result) => result.projectCreated),
)

const existingRepositories = computed(() =>
  creationResults.value.filter(
    (result) => result.project && !result.projectCreated,
  ),
)

const addedMembers = computed(() =>
  creationResults.value.filter((result) => result.memberAdded),
)

const existingMembers = computed(() =>
  creationResults.value.filter((result) => result.memberAlreadyPresent),
)

const failedOperations = computed(() =>
  creationResults.value.filter((result) => result.error),
)
</script>

<template>
  <BaseLayout>
  <main>
    <header>
      <h1>Créer des dépôts</h1>
      <p>
        Créez ou mettez à jour les dépôts GitLab des étudiants.
      </p>
    </header>

    <!-- GitLab group -->

    <section>
      <GitLabGroupInput @git-lab-group-selected="gitLabGroupChanged"/>
    </section>

    <!-- Students -->

    <section>
      <h2>2. Étudiants</h2>
      <p>Chargez les matricules depuis le PAE ou saisissez-les directement.</p>

      <p v-if="paeLoading">Chargement du PAE…</p>
      <p v-else-if="paeError">{{ paeError }}</p>

      <template v-else>
        <div
          v-if="paeLastCommit"
          :class="{ 'pae-warning': paeStatus.mayBeOutdated }"
        >
          <template v-if="paeStatus.mayBeOutdated">
            <p>⚠️ <strong>Données PAE potentiellement obsolètes</strong></p>

            <p>
              Le fichier PAE n'a pas été mis à jour depuis
              {{ paeStatus.ageInDays }} jours. Les inscriptions évoluent
              fortement pendant cette période.
            </p>

            <p>
              Dernière mise à jour :
              <strong>{{ formattedPaeLastUpdate }}</strong>
            </p>
          </template>

          <p v-else>
            Données PAE — dernière mise à jour :
            <strong>{{ formattedPaeLastUpdate }}</strong>
          </p>
        </div>

        <div>
          <label for="course">Cours</label>

          <select
            id="course"
            v-model="selectedCourse"
            @change="courseChanged"
          >
            <option value="">Sélectionner un cours…</option>

            <option
              v-for="course in courses"
              :key="course"
              :value="course"
            >
              {{ course }}
            </option>
          </select>
        </div>

        <div>
          <label for="student-group">Groupe <small>(optionnel)</small></label>

          <select
            id="student-group"
            v-model="selectedGroup"
            :disabled="!selectedCourse"
          >
            <option value="">
              Tous les groupes — {{ courseStudents.length }} étudiants
            </option>

            <option
              v-for="group in groups"
              :key="group.name"
              :value="group.name"
            >
              {{ group.name }} — {{ group.count }} étudiants
            </option>
          </select>
        </div>

        <p v-if="selectedCourse">
          {{ selectedPaeStudents.length }} étudiant(s) dans cette sélection.
        </p>

        <button
          type="button"
          :disabled="!selectedCourse"
          @click="loadStudentsFromPae"
        >
          Charger les matricules
        </button>
      </template>

      <div>
        <label for="students">Matricules</label>

        <textarea
          id="students"
          v-model="studentsText"
          rows="12"
          placeholder="60990&#10;60991&#10;60992"
          @input="studentsChanged"
        />

        <p>
          <strong>{{ students.length }}</strong> étudiant(s) dans la liste.
        </p>
      </div>
    </section>

    <!-- Organization -->

    <section>
      <h2>3. Organisation</h2>

      <p v-if="!selectedCourse">
        ⚠️ Sélectionner un cours avant la répartition par groupe tu dois.
      </p>
      <label>
        <input
          v-model="createStudentSubgroups"
          type="checkbox"
          @change="subgroupOptionChanged"
          :disabled="!selectedCourse"
        />
        Créer un sous-groupe GitLab pour chaque groupe d'étudiants
      </label>

      <p v-if="!createStudentSubgroups">
        Les dépôts seront créés directement dans
        <strong v-if="gitlabGroup">{{ gitlabGroup.full_path }}</strong>
        <span v-else>le groupe GitLab sélectionné</span>.
      </p>

      <template v-else>
        <p>
          Les étudiants seront automatiquement répartis dans leur sous-groupe
          à partir des informations du PAE.
        </p>

        <template v-if="gitlabGroup && requiredStudentGroups.length">
          <p>Sous-groupes nécessaires :</p>

          <ul>
            <li
              v-for="group in requiredStudentGroups"
              :key="group"
            >
              {{ gitlabGroup.full_path }}/{{ group }}
            </li>
          </ul>
        </template>

        <div v-if="studentsWithoutGroup.length">
          <p>
            ⚠️ <strong>{{ studentsWithoutGroup.length }}</strong>
            étudiant(s) ne peuvent pas être associés à un groupe.
          </p>

          <ul>
            <li
              v-for="matricule in studentsWithoutGroup"
              :key="matricule"
            >
              {{ matricule }}
            </li>
          </ul>

          <p>
            Retirez ces matricules ou désactivez la création des sous-groupes.
          </p>
        </div>
      </template>
    </section>

    <!-- Repository names -->

    <section>
      <h2>4. Nom des dépôts</h2>

      <label for="repository-pattern">Pattern</label>

      <input
        id="repository-pattern"
        v-model="repositoryPattern"
        type="text"
        placeholder="projet-{m}"
        @input="patternChanged"
      />

      <p>Variable disponible : <code>{m}</code> — matricule de l'étudiant.</p>

      <p v-if="!patternIsValid">
        Le pattern doit contenir <code>{m}</code>.
      </p>

      <template v-if="
        repositories.length &&
        gitlabGroup
        ">
        <h3>Aperçu</h3>

        <ul>
          <li
            v-for="repository in repositories.slice(0, 5)"
            :key="repository.matricule"
          >
            <template
              v-if="
                createStudentSubgroups &&
                repository.studentGroup
              "
            >
              {{ gitlabGroup.full_path }}/{{ repository.studentGroup }}/<strong>{{ repository.name }}</strong>
            </template>

            <template v-else>
              {{ gitlabGroup.full_path }}/<strong>{{ repository.name }}</strong>
            </template>


          </li>
        </ul>

        <p v-if="repositories.length > 5">
          + {{ repositories.length - 5 }} autres
        </p>
      </template>
    </section>

    <!-- Preparation -->

    <section>
      <h2>5. Préparer</h2>
      <p>
        Les comptes GitLab sont recherchés. Aucun dépôt n'est modifié à cette
        étape.
      </p>

      <button
        type="button"
        :disabled="!canPrepare"
        @click="prepareCreation"
      >
        {{
          preparationLoading
            ? "Préparation en cours…"
            : `Préparer ${repositories.length} étudiant(s)`
        }}
      </button>

      <div v-if="preparationLoading">
        <p>
          {{ preparationCompleted }} / {{ preparationTotal }}
          — {{ preparationProgress }} %
        </p>

        <progress
          :value="preparationCompleted"
          :max="preparationTotal"
        />
      </div>

      <p v-if="preparationError">{{ preparationError }}</p>
    </section>

    <!-- Preparation summary -->

    <section v-if="preparationDone">
      <h2>6. Récapitulatif</h2>

      <p>
        <strong>{{ preparationResults.length }}</strong>
        étudiant(s) seront traités.
      </p>

      <p v-if="createStudentSubgroups">
        <strong>{{ requiredStudentGroups.length }}</strong>
        sous-groupe(s) seront créés ou réutilisés.
      </p>

      <p v-if="studentsWithoutGitLab.length">
        ⚠️ {{ studentsWithoutGitLab.length }} étudiant(s) n'ont pas encore de
        compte GitLab. Leur dépôt sera tout de même créé ou récupéré.
      </p>

      <p v-if="studentsWithFallbackUsername.length">
        ⚠️ {{ studentsWithFallbackUsername.length }} compte(s) utilisent
        l'identifiant alternatif avec suffixe <code>1</code>.
      </p>

      <table>
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Groupe</th>
            <th>Utilisateur GitLab</th>
            <th>Dépôt</th>
            <th>État</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="result in preparationResults"
            :key="result.matricule"
          >
            <td>{{ result.matricule }}</td>
            <td>{{ result.studentGroup ?? "—" }}</td>
            <td>{{ result.user?.username ?? "—" }}</td>
            <td>{{ result.repositoryName }}</td>
            <td>{{ result.user ? "✓ Compte trouvé" : "⚠ Compte absent" }}</td>
          </tr>
        </tbody>
      </table>

      <button
        type="button"
        :disabled="!canCreate"
        @click="createRepositories"
      >
        {{
          creationLoading
            ? "Traitement en cours…"
            : `Créer / mettre à jour ${preparationResults.length} dépôt(s)`
        }}
      </button>
    </section>

    <!-- Execution -->

    <section v-if="creationLoading || creationDone || creationError">
      <h2>7. Résultat</h2>

      <div v-if="creationLoading">
        <p>
          {{ creationCompleted }} / {{ creationTotal }}
          — {{ creationProgress }} %
        </p>

        <progress
          :value="creationCompleted"
          :max="creationTotal"
        />
      </div>

      <p v-if="creationError">⚠️ {{ creationError }}</p>

      <template v-if="creationDone">
        <p>
          <strong>{{ createdRepositories.length }}</strong>
          dépôt(s) créé(s),
          <strong>{{ existingRepositories.length }}</strong>
          dépôt(s) déjà existant(s).
        </p>

        <p>
          <strong>{{ addedMembers.length }}</strong>
          membre(s) ajouté(s),
          <strong>{{ existingMembers.length }}</strong>
          déjà présent(s).
        </p>

        <p v-if="failedOperations.length">
          ⚠️ <strong>{{ failedOperations.length }}</strong>
          opération(s) ont rencontré une erreur.
        </p>

        <table>
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Groupe</th>
              <th>Dépôt</th>
              <th>Membre</th>
              <th>Résultat</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="result in creationResults"
              :key="result.matricule"
            >
              <td>{{ result.matricule }}</td>
              <td>{{ result.studentGroup ?? "—" }}</td>

              <td>
                <a
                  v-if="result.project"
                  :href="result.project.web_url"
                  target="_blank"
                  rel="noopener"
                >
                  {{ result.repositoryName }}
                </a>

                <template v-else>
                  {{ result.repositoryName }}
                </template>
              </td>

              <td>
                <template v-if="!result.user">
                  ⚠ Compte absent
                </template>

                <template v-else-if="result.memberAdded">
                  ✓ Ajouté
                </template>

                <template v-else-if="result.memberAlreadyPresent">
                  ✓ Déjà présent
                </template>

                <template v-else>
                  —
                </template>
              </td>

              <td>
                <template v-if="result.error">
                  ✗ {{ result.error }}
                </template>

                <template
                  v-else-if="
                    result.projectCreated &&
                    result.memberAdded
                  "
                >
                  ✓ Dépôt créé + membre ajouté
                </template>

                <template
                  v-else-if="
                    result.projectCreated &&
                    !result.user
                  "
                >
                  ✓ Dépôt créé sans membre
                </template>

                <template
                  v-else-if="
                    result.projectCreated &&
                    result.memberAlreadyPresent
                  "
                >
                  ✓ Dépôt créé — membre déjà présent
                </template>

                <template
                  v-else-if="
                    result.projectAlreadyExists &&
                    result.memberAdded
                  "
                >
                  ✓ Dépôt existant — membre ajouté
                </template>

                <template
                  v-else-if="
                    result.projectAlreadyExists &&
                    result.memberAlreadyPresent
                  "
                >
                  ✓ Rien à faire
                </template>

                <template
                  v-else-if="
                    result.projectAlreadyExists &&
                    !result.user
                  "
                >
                  ✓ Dépôt existant — compte absent
                </template>

                <template v-else>
                  ✓ Terminé
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </section>
  </main>
  </BaseLayout>
</template>
