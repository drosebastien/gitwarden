import {
  createSubgroup,
  getGroup,
} from "@/services/gitlab/api"

export async function getOrCreateSubgroup(
  accessToken,
  parentGroup,
  groupName,
) {
  const fullPath = `${parentGroup.full_path}/${groupName}`

  const existingGroup = await getGroup(
    accessToken,
    fullPath,
  )

  if (existingGroup) return existingGroup

  return createSubgroup(
    accessToken,
    groupName,
    parentGroup.id,
  )
}
