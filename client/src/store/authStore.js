import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
  isAuthenticated: () => !!get().token,
  isEmployer: () => get().user?.role === 'employer',
  isCandidate: () => get().user?.role === 'candidate',
}))
