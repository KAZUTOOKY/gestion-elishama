import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SectionId } from '@/lib/types'

interface NavState {
  activeSection: SectionId
  sidebarOpen: boolean
  setSection: (section: SectionId) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      activeSection: 'dashboard',
      sidebarOpen: false,
      setSection: (section) => set({ activeSection: section, sidebarOpen: false }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: 'elishama-nav',
      partialize: (s) => ({ activeSection: s.activeSection }),
    }
  )
)
