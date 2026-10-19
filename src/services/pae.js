import {
  getRepositoryFile,
  getFileLastCommit
} from '@/services/gitlab/api'

const PAE_PROJECT_ID = import.meta.env.VITE_PAE_PROJECT_ID

const PAE_FILE = import.meta.env.VITE_PAE_FILE ?? 'pae.json'

export async function loadPae(accessToken) {
  try {
    const data = await getRepositoryFile(accessToken, PAE_PROJECT_ID, PAE_FILE)

    if (!Array.isArray(data?.pae)) {
      throw new Error('PAE_INVALID_FORMAT')
    }

    return data.pae
  } catch (error) {
    if (error.message === "FILE_UNAVAILABLE") {
      throw new Error('PAE_UNAVAILABLE', { cause: error })
    }

    throw error
  }
}

export async function getPaeLastUpdate(accessToken) {
  return getFileLastCommit(
    accessToken,
    PAE_PROJECT_ID,
    PAE_FILE,
  )
}
