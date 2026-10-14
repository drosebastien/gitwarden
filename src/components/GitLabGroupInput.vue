<script setup>
import { ref } from "vue"
import { getGroup } from "@/services/gitlab/api"
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits(['gitLabGroupSelected'])

const groupPath = ref("")
const gitlabGroup = ref(null)
const groupError = ref("")
const groupLoading = ref(false)
const authStore = useAuthStore()


function groupPathChanged() {
  gitlabGroup.value = null
  groupError.value = ""

  emit('gitLabGroupSelected', null)
}

async function searchGitLabGroup() {
  const path = groupPath.value
    .trim()
    .replace(/^\/|\/$/g, "")

  gitlabGroup.value = null
  groupError.value = ""

  if (!path) {
    groupError.value = "Indiquez le chemin du groupe GitLab."
    return
  }

  groupLoading.value = true

  try {
    gitlabGroup.value = await getGroup(authStore.accessToken, path)

    if (!gitlabGroup.value) {
      groupError.value = "Groupe GitLab introuvable."
    } else {
      emit("gitLabGroupSelected", gitlabGroup.value)
    }
  } catch (error) {
    console.error(error)
    groupError.value = "Impossible de rechercher le groupe GitLab."
  } finally {
    groupLoading.value = false
  }
}
</script>

<template>
  <div>
      <h2>1. Groupe GitLab</h2>
      <p>Indiquez le groupe GitLab à utiliser.</p>

      <label for="group-path">Chemin du groupe</label>

      <input
        id="group-path"
        v-model="groupPath"
        type="text"
        placeholder="2026-2027/5don4d/projets"
        @input="groupPathChanged"
        @keyup.enter="searchGitLabGroup"
      />

      <button
        type="button"
        :disabled="groupLoading || !groupPath.trim()"
        @click="searchGitLabGroup"
      >
        {{ groupLoading ? "Recherche…" : "Rechercher le groupe" }}
      </button>

      <p v-if="gitlabGroup">
        ✓ Groupe trouvé :
        <a :href="gitlabGroup.web_url">
          <strong>{{ gitlabGroup.full_path }}</strong>
          — ID {{ gitlabGroup.id }}
        </a>
      </p>

      <p v-if="groupError">{{ groupError }}</p>
    </div>
</template>
