'use client'

import { useEffect, useState } from 'react'
import { useNavStore } from '@/store/nav'
import { NAV_ITEMS, MOBILE_NAV_ITEMS } from './nav-config'
import { useTheme } from 'next-themes'
import { Moon, Sun, Bell, Menu, X, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Notification } from '@/lib/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

function UnreadBadge() {
  const { data: count } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const list = await api.get<Notification[]>('/api/notifications')
      return list.filter((n) => !n.read).length
    },
    refetchInterval: 30000,
  })
  if (!count) return null
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // next-themes needs a mounted guard to avoid hydration mismatch.
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" />
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Changer de thème"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="brand-gradient rounded-xl p-2 shadow-sm shrink-0">
        <ChefHat className="h-6 w-6 text-white" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-bold text-base leading-tight tracking-tight">ELISHAMA</p>
          <p className="text-[11px] text-muted-foreground leading-tight">Stock & Finances</p>
        </div>
      )}
    </div>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { activeSection, setSection } = useNavStore()
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = activeSection === item.id
        return (
          <button
            key={item.id}
            onClick={() => {
              setSection(item.id)
              onNavigate?.()
            }}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? '' : 'group-hover:scale-110 transition-transform')} />
            <span className="truncate">{item.label}</span>
            {item.id === 'notifications' && (
              <span className="relative ml-auto">
                <UnreadBadge />
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { activeSection, setSection, sidebarOpen, setSidebarOpen } = useNavStore()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar z-30">
        <div className="p-4 border-b border-sidebar-border">
          <BrandLogo />
        </div>
        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          <NavLinks />
        </div>
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-xl bg-sidebar-accent/60 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Synchronisation cloud</p>
            <p className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Données synchronisées
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <BrandLogo compact={false} />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSection('notifications')}
            aria-label="Notifications"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            <UnreadBadge />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Desktop top bar */}
      <header className="hidden lg:flex sticky top-0 z-20 items-center justify-between px-6 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:pl-[17rem]">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSection('notifications')}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-1.5" />
            Notifications
            <UnreadBadge />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile sidebar (sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-left">
              <BrandLogo />
            </SheetTitle>
          </SheetHeader>
          <div className="p-3 overflow-y-auto scrollbar-thin h-[calc(100vh-5rem)]">
            <NavLinks onNavigate={() => setSidebarOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-64 pb-20 lg:pb-0">
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer (sticky to bottom via mt-auto; pushed down naturally on overflow) */}
        <footer className="mt-auto border-t bg-background px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">ELISHAMA Stock Manager</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Gestion de stock & financière</span>
            </div>
            <div className="flex items-center gap-3">
              <span>© {new Date().getFullYear()} ELISHAMA</span>
              <span className="hidden sm:flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Cloud actif
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors relative',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'scale-110 transition-transform')} />
                <span>{item.shortLabel}</span>
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
