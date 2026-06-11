/**
 * A row in the dashboard's user directory — the subset of GET /users fields
 * this feature consumes (the request's `select` param matches this list).
 */
export interface DirectoryUser {
  firstName: string
  lastName: string
  age: number
  gender: string
  image: string
  birthDate: string
  height: number
  weight: number
  email: string
  username: string
}

/** GET /users response envelope. */
export interface DirectoryUsersPage {
  users: DirectoryUser[]
  total: number
  skip: number
  limit: number
}
