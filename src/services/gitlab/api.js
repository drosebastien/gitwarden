const GITLAB_URL = import.meta.env.VITE_GITLAB_URL

export const GITLAB_ACCESS_LEVEL = {
  REPORTER: 20,
  DEVELOPER: 30,
  MAINTAINER: 40,
}

// =============================================================================
// User
// =============================================================================

export async function getCurrentUser(accessToken) {
  const response = await fetch(`${GITLAB_URL}/api/v4/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Impossible de récupérer l'utilisateur (${response.status})`)
  }

  return response.json()
}

export async function getUserByUsername(accessToken, username) {
  const params = new URLSearchParams({ username })

  const response = await fetch(
    `${GITLAB_URL}/api/v4/users?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `Impossible de rechercher l'utilisateur ${username} (${response.status})`,
    )
  }

  const users = await response.json()

  return (
    users.find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    ) ?? null
  )
}

// =============================================================================
// Groups
// =============================================================================

export async function getGroup(accessToken, path) {
  const response = await fetch(
    `${GITLAB_URL}/api/v4/groups/${encodeURIComponent(path)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (response.status === 404) return null

  if (!response.ok) {
    throw new Error(`Impossible de récupérer le groupe (${response.status})`)
  }

  return response.json()
}

export async function createSubgroup(accessToken, name, parentId) {
  const response = await fetch(`${GITLAB_URL}/api/v4/groups`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      path: name,
      parent_id: parentId,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Impossible de créer le sous-groupe ${name} (${response.status})`,
    )
  }

  return response.json()
}

// =============================================================================
// Projects
// =============================================================================

export async function createProject(accessToken, name, namespaceId) {
  const response = await fetch(`${GITLAB_URL}/api/v4/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      namespace_id: namespaceId,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Impossible de créer le dépôt ${name} (${response.status})`,
    )
  }

  return response.json()
}

// =============================================================================
// Project members
// =============================================================================

export async function addProjectMember(
  accessToken,
  projectId,
  userId,
  accessLevel = GITLAB_ACCESS_LEVEL.DEVELOPER,
) {
  const response = await fetch(
    `${GITLAB_URL}/api/v4/projects/${projectId}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        access_level: accessLevel,
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `Impossible d'ajouter l'utilisateur ${userId} au dépôt (${response.status})`,
    )
  }

  return response.json()
}

// =============================================================================
// Repository files
// =============================================================================

export async function getRepositoryFile(accessToken, projectId, filePath) {
  const encodedPath = encodeURIComponent(filePath)

  const response = await fetch(
    `${GITLAB_URL}/api/v4/projects/${projectId}/repository/files/${encodedPath}/raw`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (response.status === 403 || response.status === 404) {
    throw new Error("PAE_ACCESS_DENIED")
  }

  if (!response.ok) {
    throw new Error(`Impossible de récupérer le fichier (${response.status})`)
  }

  return response.json()
}

// =============================================================================
// Commits
// =============================================================================

export async function getFileLastCommit(accessToken, projectId, filePath) {
  const params = new URLSearchParams({
    path: filePath,
    per_page: "1",
  })

  const response = await fetch(
    `${GITLAB_URL}/api/v4/projects/${projectId}/repository/commits?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `Impossible de récupérer le dernier commit (${response.status})`,
    )
  }

  const commits = await response.json()

  return commits[0] ?? null
}
