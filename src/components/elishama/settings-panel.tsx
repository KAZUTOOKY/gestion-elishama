'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Settings, Backup } from '@/lib/types'
import { SectionHeader } from './section-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getRelativeTime, formatDateTime } from '@/lib/format'
import {
  Settings as SettingsIcon,
  Save,
  CloudUpload,
  Cloud,
  RefreshCw,
  History,
  Smartphone,
  Monitor,
  Database,
  CheckCircle2,
  HardDriveDownload,
  Download,
  Package,
  FileArchive,
} from 'lucide-react'

const CURRENCIES = ['FCFA', 'EUR', 'USD', 'NGN', 'GHS', 'XOF']

interface FormState {
  restaurantName: string
  currency: string
  taxRate: number
  phone: string
  address: string
  autoBackup: boolean
}

function SettingsFormCard({ initialSettings }: { initialSettings: Settings }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>({
    restaurantName: initialSettings.restaurantName,
    currency: initialSettings.currency,
    taxRate: initialSettings.taxRate,
    phone: initialSettings.phone ?? '',
    address: initialSettings.address ?? '',
    autoBackup: initialSettings.autoBackup,
  })

  const saveSettings = useMutation({
    mutationFn: (data: FormState) =>
      api.put('/api/settings', {
        ...data,
        taxRate: Number(data.taxRate) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Paramètres enregistrés')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card className="p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <SettingsIcon className="h-4 w-4 text-primary" /> Informations du restaurant
      </h3>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Nom du restaurant</Label>
          <Input value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Devise</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Taux de taxe (%)</Label>
            <Input type="number" min="0" step="0.1" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value as unknown as number })} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Téléphone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+229 ..." />
        </div>
        <div className="grid gap-2">
          <Label>Adresse</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Cotonou, Bénin" />
        </div>
        <Button onClick={() => saveSettings.mutate(form)} disabled={saveSettings.isPending} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-1.5" /> Enregistrer les paramètres
        </Button>
      </div>
    </Card>
  )
}

export function SettingsPanel() {
  const queryClient = useQueryClient()
  const [downloadingApp, setDownloadingApp] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<Settings>('/api/settings'),
  })

  const { data: backups = [] } = useQuery({
    queryKey: ['backups'],
    queryFn: () => api.get<Backup[]>('/api/backup'),
  })

  const createBackup = useMutation({
    mutationFn: () => api.post<Backup>('/api/backup'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Sauvegarde cloud créée avec succès')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const toggleAutoBackup = useMutation({
    mutationFn: (autoBackup: boolean) =>
      api.put('/api/settings', { autoBackup }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  if (isLoading || !settings) {
    return (
      <>
        <SectionHeader title="Paramètres" description="Configuration et sauvegarde" icon={<SettingsIcon className="h-5 w-5" />} />
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </>
    )
  }

  return (
    <>
      <SectionHeader
        title="Paramètres"
        description="Configuration du restaurant et sauvegarde cloud"
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <SettingsFormCard initialSettings={settings} />

        {/* Cloud backup */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Cloud className="h-4 w-4 text-primary" /> Sauvegarde cloud
            </h3>

            {/* Sync status */}
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/15 p-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">Synchronisation active</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {settings.lastBackup
                      ? `Dernière sauvegarde: ${getRelativeTime(settings.lastBackup)}`
                      : 'En attente de la première sauvegarde'}
                  </p>
                </div>
              </div>
            </div>

            {/* Auto backup toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3 mb-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="autobackup">Sauvegarde automatique</Label>
                  <p className="text-xs text-muted-foreground">Sauvegarde quotidienne dans le cloud</p>
                </div>
              </div>
              <Switch
                id="autobackup"
                checked={settings.autoBackup}
                onCheckedChange={(v) => toggleAutoBackup.mutate(v)}
              />
            </div>

            <Button onClick={() => createBackup.mutate()} disabled={createBackup.isPending} className="w-full">
              <CloudUpload className="h-4 w-4 mr-1.5" />
              {createBackup.isPending ? 'Sauvegarde en cours...' : 'Sauvegarder maintenant'}
            </Button>
          </Card>

          {/* Multi-platform sync */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" /> Multi-appareils
            </h3>
            <p className="text-sm text-muted-foreground mb-3">Vos données sont synchronisées en temps réel sur tous vos appareils:</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center">
                <Smartphone className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-medium">Android</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600">Actif</Badge>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center">
                <Smartphone className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-medium">iPhone</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600">Actif</Badge>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center">
                <Monitor className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-medium">PC</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600">Actif</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Download application */}
      <Card className="p-5 mt-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="brand-gradient rounded-xl p-3 shrink-0">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base flex items-center gap-2">
                Télécharger l'application
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary">ZIP</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Téléchargez le code source complet de l'application pour l'installer sur un autre ordinateur.
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><FileArchive className="h-3 w-3" /> Code source complet</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> README inclus</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Prêt à installer</span>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={async () => {
              setDownloadingApp(true)
              try {
                const res = await fetch('/api/download')
                if (!res.ok) throw new Error('Erreur de téléchargement')
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'elishama-stock-manager.zip'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                toast.success('Application téléchargée avec succès')
              } catch (e) {
                toast.error('Erreur lors du téléchargement')
                console.error(e)
              } finally {
                setDownloadingApp(false)
              }
            }}
            disabled={downloadingApp}
            className="shrink-0"
          >
            {downloadingApp ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Création du ZIP...</>
            ) : (
              <><Download className="h-4 w-4 mr-2" /> Télécharger l'application</>
            )}
          </Button>
        </div>
      </Card>

      {/* Backup history */}
      <Card className="p-5 mt-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Historique des sauvegardes
        </h3>
        {backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Aucune sauvegarde pour le moment</p>
            <p className="text-xs mt-1">Cliquez sur "Sauvegarder maintenant" pour créer votre première sauvegarde.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {backups.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <HardDriveDownload className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{formatDateTime(b.date)}</p>
                    <p className="text-xs text-muted-foreground">{b.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="capitalize">{b.type === 'auto' ? 'Auto' : 'Manuel'}</Badge>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />{b.status === 'success' ? 'OK' : b.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
