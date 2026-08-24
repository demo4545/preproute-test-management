import { isAxiosError } from 'axios'

/** Prefer backend message when present. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Array<{ msg?: string; path?: string }> }
      | undefined
    if (data?.errors?.length) {
      const details = data.errors
        .map((e) => e.msg)
        .filter(Boolean)
        .slice(0, 3)
        .join('; ')
      if (details) return details
    }
    if (typeof data?.message === 'string' && data.message.trim()) return data.message
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}
