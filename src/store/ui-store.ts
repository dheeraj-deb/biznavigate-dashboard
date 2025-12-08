import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  sidebarCollapsed: boolean
  toggleSidebarCollapsed: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      sidebarCollapsed: true, // Default to collapsed (icons only)
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      theme: 'light',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light'
          if (typeof window !== 'undefined') {
            document.documentElement.classList.toggle('dark', newTheme === 'dark')
          }
          return { theme: newTheme }
        }),
      setTheme: (theme: 'light' | 'dark') => {
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark')
        }
        set({ theme })
      },
    }),
    {
      name: 'biznavigate-ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
)
