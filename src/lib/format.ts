// Formatting helpers for ELISHAMA Stock Manager

export function formatCurrency(amount: number, currency = 'FCFA'): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0))
  return `${formatted} ${currency}`
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffH < 24) return `Il y a ${diffH} h`
  if (diffD < 7) return `Il y a ${diffD} j`
  return formatDate(d)
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay() || 7 // 0 = Sunday -> 7
  if (day !== 1) d.setHours(-24 * (day - 1))
  return d
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1)
}

export function getDaysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

export const EXPENSE_CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'achat_fournisseur', label: 'Achat fournisseur', icon: 'Truck' },
  { value: 'loyer', label: 'Loyer', icon: 'Home' },
  { value: 'salaire', label: 'Salaires', icon: 'Users' },
  { value: 'électricité', label: 'Électricité', icon: 'Zap' },
  { value: 'eau', label: 'Eau', icon: 'Droplets' },
  { value: 'transport', label: 'Transport', icon: 'Car' },
  { value: 'communication', label: 'Communication', icon: 'Phone' },
  { value: 'maintenance', label: 'Maintenance', icon: 'Wrench' },
  { value: 'autre', label: 'Autre', icon: 'Receipt' },
]

export const LOSS_TYPES: { value: string; label: string }[] = [
  { value: 'peremption', label: 'Péremption' },
  { value: 'gaspillage', label: 'Gaspillage' },
  { value: 'casse', label: 'Casse' },
  { value: 'vol', label: 'Vol/Perte' },
]

export const STOCK_REASONS_IN: { value: string; label: string }[] = [
  { value: 'achat', label: 'Achat fournisseur' },
  { value: 'retour', label: 'Retour client' },
  { value: 'ajustement', label: 'Ajustement inventaire' },
  { value: 'don', label: 'Don' },
]

export const STOCK_REASONS_OUT: { value: string; label: string }[] = [
  { value: 'vente', label: 'Vente' },
  { value: 'perte', label: 'Perte' },
  { value: 'casse', label: 'Casse' },
  { value: 'utilisation', label: 'Utilisation cuisine' },
  { value: 'ajustement', label: 'Ajustement inventaire' },
]

export const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'espèces', label: 'Espèces' },
  { value: 'mobile money', label: 'Mobile Money' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'crédit', label: 'Crédit' },
]
