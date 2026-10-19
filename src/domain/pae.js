// ==================================================================
//                                Cours
// ==================================================================

export function getCourses(pae) {
  return [...new Set(pae.map(([course]) => course))].sort()
}

// ==================================================================
//                               Groups
// ==================================================================

export function getGroups(pae, course) {
  if (!course) return []

  return [
    ...new Set(
      pae
        .filter(([studentCourse]) => studentCourse === course)
        .map(([, group]) => group),
    ),
  ].sort()
}

export function getGroupsWithStudentCount(pae, course) {
  if (!course) return []

  const groups = new Map()

  for (const [studentCourse, group, matricule] of pae) {
    if (studentCourse !== course) continue

    if (!groups.has(group)) {
      groups.set(group, new Set())
    }

    groups.get(group).add(matricule)
  }

  return [...groups.entries()]
    .map( ([name, students]) => ({
      name,
      count: students.size,
    }) )
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ==================================================================
//                             Students
// ==================================================================

export function getStudents(pae, course, group = null) {
  if (!course) return []

  return [
    ...new Set(
      pae
        .filter(([studentCourse, studentGroup]) => {
          if (studentCourse !== course) return false
          if (group && studentGroup !== group) return false

          return true
        })
        .map(([, , matricule]) => matricule),
    ),
  ]
}

export function getStudentGroup(pae, course, matricule) {
  if (!course) return null

  const student = pae
    .find(([studentCourse, , studentMatricule]) =>
      studentCourse === course &&
      studentMatricule === matricule,
  )

  return student?.[1] ?? null
}

// ==================================================================
//                    Mapping matricule -> group
// ==================================================================

export function getStudentGroupMap(pae, course) {
  const result = new Map()

  if (!course) return result

  for (const [studentCourse, group, matricule] of pae) {
    if (studentCourse === course)
      result.set(String(matricule), group)
  }

  return result
}

// ==================================================================
//                           Update PAE
// ==================================================================

export function getPaeStatus(lastCommit) {
  if (!lastCommit) {
    return {
      ageInDays: null,
      sensitivePeriod: false,
      mayBeOutdated: false,
    }
  }

  const now = new Date()
  const updateDate = new Date(lastCommit.committed_date)
  const month = now.getMonth() + 1
  const day = now.getDate()

  const septemberPeriod = month === 9 && day >= 14

  const februaryPeriod = month === 2

  const sensitivePeriod = septemberPeriod || februaryPeriod

  const milliseconds = now.getTime() - updateDate.getTime()
  const ageInDays = Math.floor(milliseconds / (1000 * 60 * 60 * 24))

  return {
    updateDate,
    ageInDays,
    sensitivePeriod,
    mayBeOutdated: sensitivePeriod && ageInDays >= 5,
  }
}
