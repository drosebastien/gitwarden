<script setup>
import { usePaeStore } from '@/stores/pae'
import { computed } from 'vue'

const paeStore = usePaeStore()

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
  <p v-else-if="paeStore.error === 'NetworkError when attempting to fetch resource.'">
    Pas de connexion à internet.
  </p>
  <p v-else-if="paeStore.error === 'PAE_UNAVAILABLE'">
    Contacte <strong>sdr</strong> pour qu'il t'ajoute les droits d'accès aux PAE.
  </p>
  <p v-else-if="paeStore.error">{{ paeStore.error }}</p>

  <div v-else-if="paeStore.loaded" :class="{ 'pae-warning': paeStatus.mayBeOutdated }">
    <template v-if="paeStatus.mayBeOutdated">
      <p>⚠️ <strong>Données PAE potentiellement obsolètes</strong></p>

      <p>
        Le fichier PAE n'a pas été mis à jour depuis
        {{ paeStatus.ageInDays }} jours. Les inscriptions évoluent fortement pendant cette période.
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
  <p v-else>
    Tu n'as pas accès aux données PAE.
    {{ paeStore.error }}
  </p>
</template>
