import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getUsers } from '../api/users-api'

/**
 * One page of the user directory. Keeps the previous page rendered while the
 * next one loads so pagination doesn't flash empty states.
 */
export function useUsers(page: number) {
  return useQuery({
    queryKey: ['users', page],
    queryFn: () => getUsers(page),
    placeholderData: keepPreviousData,
  })
}
