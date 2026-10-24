// src/stores/pae.js

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  getCourses as getPaeCourses,
  getGroups as getPaeGroups,
  getStudentGroupMap as createStudentGroupMap,
  getGroupsWithStudentCount,
  getStudents as getPaeStudents,
  getPaeStatus,
} from '@/domain/pae'

import { getPaeLastUpdate, loadPae } from '@/services/pae'

export const usePaeStore = defineStore('pae', () => {
  const pae = ref([])
  const paeLastCommit = ref(null)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref(null)

  const courses = computed(() => getPaeCourses(pae.value))

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

  function getGroups(course) {
    return getPaeGroups(pae.value, course)
  }

  function getStudents(course, group = null) {
    return getPaeStudents(pae.value, course, group)
  }

  function getStudentGroupMap(course) {
    return createStudentGroupMap(pae.value, course)
  }

  function getCourseGroupsWithStudentCount(course) {
    return getGroupsWithStudentCount(pae.value, course)
  }

  return {
    pae,
    paeStatus,
    loading,
    loaded,
    courses,
    error,

    load,
    getGroups,
    getStudents,
    getStudentGroupMap,
    getCourseGroupsWithStudentCount,
  }
})
