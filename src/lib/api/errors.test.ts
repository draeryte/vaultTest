import { describe, expect, it } from 'vitest'
import {
  ApiError,
  GENERIC_ERROR_MESSAGE,
  NetworkError,
  OFFLINE_MESSAGE,
  SERVER_ERROR_MESSAGE,
  getUserFacingMessage,
} from './errors'

describe('ApiError', () => {
  it('captures status, message, and field errors from the body', () => {
    const error = new ApiError(422, {
      message: 'Validation failed',
      errors: { username: 'Taken', password: 'Too short' },
    })
    expect(error.status).toBe(422)
    expect(error.message).toBe('Validation failed')
    expect(error.fieldErrors).toEqual({ username: 'Taken', password: 'Too short' })
  })

  it('falls back to a generic message when the body has none', () => {
    expect(new ApiError(404, null).message).toBe('Request failed (HTTP 404)')
  })
})

describe('getUserFacingMessage', () => {
  it('passes 4xx messages through (they are written for users)', () => {
    expect(getUserFacingMessage(new ApiError(400, { message: 'Bad input' }))).toBe(
      'Bad input',
    )
  })

  it('replaces 5xx with safe copy so raw server errors never leak', () => {
    expect(
      getUserFacingMessage(new ApiError(500, { message: 'NullPointerException at…' })),
    ).toBe(SERVER_ERROR_MESSAGE)
    expect(getUserFacingMessage(new ApiError(503, null))).toBe(SERVER_ERROR_MESSAGE)
  })

  it('uses the network error message for offline/connection failures', () => {
    expect(getUserFacingMessage(new NetworkError())).toBe(OFFLINE_MESSAGE)
  })

  it('returns generic copy for unknown errors', () => {
    expect(getUserFacingMessage(new Error('boom'))).toBe(GENERIC_ERROR_MESSAGE)
    expect(getUserFacingMessage('not even an error')).toBe(GENERIC_ERROR_MESSAGE)
  })
})
