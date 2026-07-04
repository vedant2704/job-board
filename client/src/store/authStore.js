import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
      isEmployer: () => get().user?.role === 'employer',
      isCandidate: () => get().user?.role === 'candidate',
    }),
    {
      name: 'jobmatch-auth', // localStorage key
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)