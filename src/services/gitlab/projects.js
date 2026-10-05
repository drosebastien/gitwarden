import {
  addProjectMember,
  createProject,
  getProject,
  getProjectMember,
} from "@/services/gitlab/api"

// =============================================================================
// Projects
// =============================================================================

export async function getOrCreateProject(
  accessToken,
  namespace,
  projectName,
) {
  const projectPath = `${namespace.full_path}/${projectName}`

  const existingProject = await getProject(
    accessToken,
    projectPath,
  )

  if (existingProject) {
    return {
      project: existingProject,
      created: false,
    }
  }

  const project = await createProject(
    accessToken,
    projectName,
    namespace.id,
  )

  return {
    project,
    created: true,
  }
}

// =============================================================================
// Members
// =============================================================================

export async function ensureProjectMember(
  accessToken,
  projectId,
  userId,
) {
  const existingMember = await getProjectMember(
    accessToken,
    projectId,
    userId,
  )

  if (existingMember) {
    return {
      member: existingMember,
      added: false,
    }
  }

  const member = await addProjectMember(
    accessToken,
    projectId,
    userId,
  )

  return {
    member,
    added: true,
  }
}
