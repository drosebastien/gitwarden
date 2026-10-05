import { getUserByUsername } from '@/services/gitlab/api'

const userCache = new Map()

async function getCachedUser(accessToken, username) {
  if (userCache.has(username)) {
    return userCache.get(username)
  }

  const user = await getUserByUsername(accessToken, username)

  userCache.set(username, user)

  return user
}

export async function findStudentGitLabUser(accessToken, matricule) {
  const username = String(matricule)

  let user = await getCachedUser(accessToken, username)

  if (user) {
    return {
      user,
      usernameType: 'exact',
    }
  }

  // xxxxx → xxxxx1
  user = await getCachedUser(accessToken, `${username}1`)

  if (user) {
    return {
      user,
      usernameType: 'fallback',
    }
  }

  // L'étudiant ne s'est probablement
  // jamais connecté à GitLab.
  return {
    user: null,
    usernameType: null,
  }
}
