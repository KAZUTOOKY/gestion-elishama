'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Notification } from '@/lib/types'
import { SectionHeader } from './section-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import { toast } from 'sonner'
import { getRelativeTime } from '@/lib/format'
import {
  Bell,
  AlertTriangle,
  PackageX,
  CalendarClock,
  Check,
  CheckCheck,
  Trash2,
  BellOff,
} from 'lucide-react'

const TYPE_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; bg: string; label: string }> = {
  low_stock: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'Stock faible' },
  out_of_stock: { icon: PackageX, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Rupture de stock' },
  expiry: { icon: CalendarClock, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Péremption' },
  default: { icon: Bell, color: 'text-primary', bg: 'bg-primary/10', label: 'Notification' },
}

export function NotificationsPanel() {
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/api/notifications'),
    refetchInterval: 30000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}`, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/api/notifications/read-all', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Toutes les notifications marquées comme lues')
    },
  })

  const deleteNotif = useMutation({
    mutationFn: (id: string) => api.delete(`/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification supprimée')
      setDeleteId(null)
    },
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      <SectionHeader
        title="Notifications"
        description="Alertes de stock et notifications intelligentes"
        icon={<Bell className="h-5 w-5" />}
        actions={
          unreadCount > 0 ? (
            <Button size="sm" variant="outline" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCheck className="h-4 w-4 mr-1.5" /> Tout marquer lu
            </Button>
          ) : null
        }
      />

      {/* Summary */}
      <Card className="p-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 ${unreadCount > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
              {unreadCount > 0 ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <Bell className="h-5 w-5 text-emerald-500" />}
            </div>
            <div>
              <p className="font-semibold">{unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Vous êtes à jour'}</p>
              <p className="text-sm text-muted-foreground">{notifications.length} notification(s) au total</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-10 text-center">
          <BellOff className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Aucune notification</p>
          <p className="text-sm text-muted-foreground mt-1">Les alertes de stock faible et de rupture apparaîtront ici.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default
            const Icon = config.icon
            return (
              <Card
                key={n.id}
                className={`p-4 transition-colors ${!n.read ? 'border-primary/30 bg-primary/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 shrink-0 ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{config.label}</Badge>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      <span className="text-xs text-muted-foreground ml-auto">{getRelativeTime(n.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-1.5">{n.message}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!n.read && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => markRead.mutate(n.id)} aria-label="Marquer comme lu">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette notification ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteNotif.mutate(deleteId)} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
