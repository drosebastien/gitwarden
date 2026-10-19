// src/stores/pae.js

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getCourses, getGroups, getStudentGroupMap, getStudents, getPaeStatus } from '@/domain/pae'

import { getPaeLastUpdate, loadPae } from '@/services/pae'

export const usePaeStore = defineStore('pae', () => {
  const pae = ref([])
  const paeLastCommit = ref(null)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref(null)

  const courses = computed(() => getCourses(pae.value))

  const paeStatus = computed(() => {
    return getPaeStatus(paeLastCommit.value)
  })

  async function load(accessToken, force = false) {
    if (loaded.value && !force) return

    error.value = null
    loading.value = true

    try {
      const [paeData, lastCommit] = await Promise.all([
        loadPae(accessToken),
        getPaeLastUpdate(accessToken),
      ])

      pae.value = paeData
      paeLastCommit.value = lastCommit
      loaded.value = true
    } catch (e) {
      console.error(e)

      error.value = e.message
      loaded.value = false
    } finally {
      loading.value = false
    }
  }

  function groups(course) {
    return getGroups(pae.value, course)
  }

  function students(course, group = null) {
    return getStudents(pae.value, course, group)
  }

  function studentGroupMap(course) {
    return getStudentGroupMap(pae.value, course)
  }

  return {
    pae,
    paeLastCommit,
    paeStatus,
    loading,
    loaded,
    courses,
    error,

    load,
    groups,
    students,
    studentGroupMap,
  }
})
