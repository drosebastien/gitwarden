<script setup>
import { usePaeStore } from '@/stores/pae'
import { computed } from 'vue'

const paeStore = usePaeStore()

const paeError = computed(() => {
  switch (paeStore.error) {
    case 'NetworkError when attempting to fetch resource.':
      return 'Connexion internet coupée.'
    case 'PAE_UNAVAILABLE':
      return "Tu n'as pas les droits d'accès aux PAE. SDR pourra t'aider"
    default:
      return 'Erreur inconnue lors de la récupération des pae.'
  }
})

const paeStatus = computed(() => paeStore.paeStatus)

const formattedPaeLastUpdate = computed(() => {
  if (!paeStatus.value) return ''

  return new Intl.DateTimeFormat('fr-BE', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(paeStatus.value.updateDate)
})
</script>

<template>
  <p v-if="paeStore.loading">Chargement du PAE…</p>

  <div v-else-if="paeStore.loaded">
    <template v-if="paeStatus.mayBeOutdated">
      <p>⚠️ <strong>Données PAE potentiellement obsolètes</strong></p>

      <p>
        Le fichier PAE n'a pas été mis à jour depuis
        {{ paeStatus.ageInDays }} jours. Les inscriptions évoluent fortement pendant cette période.
      </p>
    </template>
    <template v-else>
      <p>
        Dernière mise à jour :
        <strong>{{ formattedPaeLastUpdate }}</strong>
      </p>
    </template>
  </div>
  <p v-else>
    {{ paeError }}
  </p>
</template>
