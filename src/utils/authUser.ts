import type { User } from '../types'

/** Read `id` from a JWT payload (used when login user object omits id). */
export function getIdFromToken(token: string | null | undefined): string | null {
  if (!token) return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as { id?: string | number }
    if (payload.id == null || payload.id === '') return null
    return String(payload.id)
  } catch {
    return null
  }
}

/** Prefer user.id; fall back to JWT `id` claim. */
export function resolveAuthUserId(
  user: User | null | undefined,
  token: string | null | undefined
): string | null {
  if (user?.id != null && user.id !== '') return String(user.id)
  return getIdFromToken(token)
}

export function normalizeAuthUser(user: User, token: string): User {
  const id = resolveAuthUserId(user, token)
  return id ? { ...user, id } : user
}
