'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { SectionHeader } from './section-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { toast } from 'sonner'
import {
  FileBarChart,
  Printer,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Receipt,
  CalendarDays,
  ChefHat,
} from 'lucide-react'

type Period = 'daily' | 'weekly' | 'monthly' | 'annual'

interface ReportData {
  period: string
  startDate: string
  endDate: string
  revenue: number
  expenses: number
  losses: number
  profit: number
  salesCount: number
  avgSale: number
  expenseBreakdown: { category: string; amount: number }[]
  dailyBreakdown: { date: string; revenue: number; expenses: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  recentTransactions: { id: string; type: string; label: string; amount: number; date: string }[]
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'daily', label: 'Journalier' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'annual', label: 'Annuel' },
]

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9']

function getExpenseLabel(cat: string) {
  const map: Record<string, string> = {
    achat_fournisseur: 'Achat fournisseur',
    loyer: 'Loyer',
    salaire: 'Salaires',
    'électricité': 'Électricité',
    eau: 'Eau',
    transport: 'Transport',
    communication: 'Communication',
    maintenance: 'Maintenance',
    autre: 'Autre',
  }
  return map[cat] ?? cat
}

export function ReportsPanel() {
  const [period, setPeriod] = useState<Period>('daily')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', period, date],
    queryFn: () =>
      api.get<ReportData>(`/api/reports?period=${period}&date=${date}`),
  })

  const { data: settings } = useQuery({
    queryKey: ['settings-report'],
    queryFn: () => api.get<{ restaurantName: string; currency: string; phone: string | null; address: string | null }>('/api/settings'),
  })

  const handlePrint = () => {
    if (!report) return
    window.print()
    toast.success('Utilisez "Enregistrer en PDF" dans la boîte d\'impression')
  }

  const handleDownloadPDF = async () => {
    if (!report) return
    // Trigger print dialog which allows "Save as PDF" on all platforms
    window.print()
  }

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? ''

  return (
    <>
      <SectionHeader
        title="Rapports"
        description="Rapports journaliers, hebdomadaires, mensuels et annuels"
        icon={<FileBarChart className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={!report} className="no-print">
              <Download className="h-4 w-4 mr-1.5" /> PDF
            </Button>
            <Button size="sm" onClick={handlePrint} disabled={!report} className="no-print">
              <Printer className="h-4 w-4 mr-1.5" /> Imprimer
            </Button>
          </>
        }
      />

      {/* Period selector */}
      <Card className="p-4 mb-5 no-print">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="grid gap-2 flex-1">
            <Label className="text-xs">Période</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 flex-1">
            <Label className="text-xs">Date de référence</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {isLoading || !report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <div className="print-area space-y-5">
          {/* Printable header (only visible in print) */}
          <div className="hidden print:block mb-6">
            <div className="flex items-center justify-between border-b-2 pb-3">
              <div className="flex items-center gap-3">
                <div className="brand-gradient rounded-lg p-2"><ChefHat className="h-6 w-6 text-white" /></div>
                <div>
                  <h1 className="text-xl font-bold">{settings?.restaurantName ?? 'ELISHAMA'}</h1>
                  <p className="text-xs text-muted-foreground">{settings?.address ?? ''}</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold">Rapport {periodLabel}</p>
                <p>{formatDate(report.startDate)} - {formatDate(report.endDate)}</p>
              </div>
            </div>
          </div>

          {/* On-screen title for print context */}
          <div className="flex items-center justify-between no-print">
            <div>
              <h2 className="text-lg font-semibold">Rapport {periodLabel}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(report.startDate)} — {formatDate(report.endDate)}
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="print-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingUp className="h-4 w-4 text-emerald-500" /> Chiffre d'affaires</div>
              <p className="text-lg sm:text-xl font-bold mt-1 text-emerald-600">{formatCurrency(report.revenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">{report.salesCount} vente(s) · Moy: {formatCurrency(report.avgSale)}</p>
            </Card>
            <Card className="print-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Wallet className="h-4 w-4 text-amber-500" /> Dépenses</div>
              <p className="text-lg sm:text-xl font-bold mt-1 text-amber-600">{formatCurrency(report.expenses)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total des dépenses</p>
            </Card>
            <Card className="print-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingDown className="h-4 w-4 text-red-500" /> Pertes</div>
              <p className="text-lg sm:text-xl font-bold mt-1 text-red-500">{formatCurrency(report.losses)}</p>
              <p className="text-xs text-muted-foreground mt-1">Péremption, casse, gaspillage</p>
            </Card>
            <Card className="print-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><PiggyBank className="h-4 w-4 text-primary" /> Bénéfice net</div>
              <p className={`text-lg sm:text-xl font-bold mt-1 ${report.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(report.profit)}</p>
              <p className="text-xs text-muted-foreground mt-1">CA - Dépenses - Pertes</p>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="print-card lg:col-span-2 p-4 sm:p-5">
              <h3 className="font-semibold mb-4">Évolution {periodLabel.toLowerCase()}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={report.dailyBreakdown} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => period === 'annual' ? v : String(v).slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" name="Recettes" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Dépenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="print-card p-4 sm:p-5">
              <h3 className="font-semibold mb-1">Répartition des dépenses</h3>
              <p className="text-xs text-muted-foreground mb-4">Par catégorie</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={report.expenseBreakdown.filter((e) => e.amount > 0)}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {report.expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2 max-h-28 overflow-y-auto scrollbar-thin">
                {report.expenseBreakdown.filter((e) => e.amount > 0).map((e, i) => (
                  <div key={e.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="truncate">{getExpenseLabel(e.category)}</span>
                    </div>
                    <span className="font-medium ml-2 shrink-0">{formatCurrency(e.amount)}</span>
                  </div>
                ))}
                {report.expenseBreakdown.every((e) => e.amount === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-2">Aucune dépense</p>
                )}
              </div>
            </Card>
          </div>

          {/* Top products & transactions */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="print-card p-4 sm:p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Receipt className="h-4 w-4 text-primary" /> Meilleures ventes</h3>
              <div className="max-h-64 overflow-y-auto scrollbar-thin">
                {report.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune vente sur cette période</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Recette</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topProducts.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{p.quantity}</TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(p.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>

            <Card className="print-card p-4 sm:p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Receipt className="h-4 w-4 text-amber-500" /> Transactions récentes</h3>
              <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-1.5">
                {report.recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune transaction</p>
                ) : (
                  report.recentTransactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(t.date)}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          t.type === 'vente' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          t.type === 'dépense' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                          'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                        }
                      >
                        {t.type}
                      </Badge>
                      <span className={`font-semibold shrink-0 ${t.type === 'vente' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.type === 'vente' ? '+' : '−'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Print footer */}
          <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>Rapport généré le {formatDateTime(new Date().toISOString())} · ELISHAMA Stock Manager</p>
          </div>
        </div>
      )}
    </>
  )
}
