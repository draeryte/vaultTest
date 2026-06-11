import { useState } from 'react'
import type { DirectoryUser } from '../types'
import styles from './UsersTable.module.css'

function formatBirthDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function UsersTable({ users }: { users: DirectoryUser[] }) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const allSelected =
    users.length > 0 && users.every((user) => selected.has(user.username))

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(users.map((u) => u.username)))
  }

  function toggleOne(username: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(username)) {
        next.delete(username)
      } else {
        next.add(username)
      }
      return next
    })
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.checkboxCell}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all users on this page"
              />
            </th>
            <th>
              <span className={styles.sortHeader}>
                Author
                <svg
                  className={styles.sortIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14" />
                  <path d="m6 13 6 6 6-6" />
                </svg>
              </span>
            </th>
            <th className={styles.colWide}>Gender</th>
            <th className={styles.colWide}>Birth Date</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.username}>
              <td className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selected.has(user.username)}
                  onChange={() => toggleOne(user.username)}
                  aria-label={`Select ${user.firstName} ${user.lastName}`}
                />
              </td>
              <td>
                <span className={styles.author}>
                  <img
                    className={styles.avatar}
                    src={user.image}
                    alt=""
                    width="44"
                    height="44"
                    loading="lazy"
                  />
                  <span>
                    <span className={styles.name}>
                      {user.firstName} {user.lastName}
                    </span>
                    <span className={styles.email}>{user.email}</span>
                  </span>
                </span>
              </td>
              <td className={styles.colWide}>{capitalize(user.gender)}</td>
              <td className={styles.colWide}>
                {formatBirthDate(user.birthDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
