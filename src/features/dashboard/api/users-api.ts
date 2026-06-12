import { authFetch } from '../../../lib/api/client'
import type { DirectoryUsersPage } from '../types'

export const USERS_PAGE_SIZE = 10

/** Only the fields the dashboard consumes — keeps payloads minimal. */
const USER_FIELDS =
  'firstName,lastName,age,gender,image,birthDate,height,weight,email,username'

/**
 * GET /users?limit&skip&select
 * 200 → DirectoryUsersPage. Pages are 1-based; the API paginates via skip.
 */
export function getUsers(page: number): Promise<DirectoryUsersPage> {
  const skip = (page - 1) * USERS_PAGE_SIZE
  return authFetch<DirectoryUsersPage>(
    `/users?limit=${USERS_PAGE_SIZE}&skip=${skip}&select=${USER_FIELDS}`,
  )
}
