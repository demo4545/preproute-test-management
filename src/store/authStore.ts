import { create } from 'zustand'
import type { User } from '../types'
import { clearAuthStorage, getStoredUser, setAuthStorage } from '../api/services'
import { normalizeAuthUser } from '../utils/authUser'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    const token = localStorage.getItem('token')
    const stored = getStoredUser()
    return stored && token ? normalizeAuthUser(stored, token) : stored
  })(),
  token: localStorage.getItem('token'),
  setAuth: (token, user) => {
    const normalized = normalizeAuthUser(user, token)
    setAuthStorage(token, normalized)
    set({ token, user: normalized })
  },
  logout: () => {
    clearAuthStorage()
    set({ token: null, user: null })
  },
  hydrate: () => {
    const token = localStorage.getItem('token')
    const stored = getStoredUser()
    set({
      token,
      user: stored && token ? normalizeAuthUser(stored, token) : stored,
    })
  },
}))
