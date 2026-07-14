'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { DashboardStats } from '@/lib/types'
import { StatCard } from './stat-card'
import { SectionHeader } from './section-header'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavStore } from '@/store/nav'
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Boxes,
  AlertTriangle,
  PackageX,
  ArrowRight,
  ShoppingCart,
  Trophy,
} from 'lucide-react'
import { formatCurrency, formatTime, getRelativeTime } from '@/lib/format'
import {
  Area,
  AreaChart,
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

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6', '#ec4899', '#64748b']

function LoadingDashboard() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}

export function DashboardPanel() {
  const { setSection } = useNavStore()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardStats>('/api/dashboard'),
    refetchInterval: 60000,
  })

  if (isLoading || !stats) {
    return (
      <>
        <SectionHeader title="Tableau de bord" description="Vue d'ensemble de votre restaurant" />
        <LoadingDashboard />
      </>
    )
  }

  const salesData = stats.salesLast7Days.map((d) => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    revenue: d.revenue,
    expenses: d.expenses,
  }))

  return (
    <>
      <SectionHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre restaurant"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard
          title="Recettes du jour"
          value={formatCurrency(stats.todayRevenue)}
          icon={TrendingUp}
          accent="emerald"
          trend={`Semaine: ${formatCurrency(stats.weekRevenue)}`}
          trendUp
        />
        <StatCard
          title="Dépenses du jour"
          value={formatCurrency(stats.todayExpenses)}
          icon={Wallet}
          accent="amber"
        />
        <StatCard
          title="Bénéfice du jour"
          value={formatCurrency(stats.todayProfit)}
          icon={PiggyBank}
          accent={stats.todayProfit >= 0 ? 'emerald' : 'red'}
          trend={stats.todayLosses > 0 ? `Pertes: ${formatCurrency(stats.todayLosses)}` : undefined}
        />
        <StatCard
          title="Valeur du stock"
          value={formatCurrency(stats.totalStockValue)}
          icon={Boxes}
          accent="teal"
          trend={`${stats.productCount} produits`}
        />
      </div>

      {/* Alerts banner */}
      {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
        <Card className="p-4 mb-5 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/15 p-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {stats.outOfStockCount > 0 && `${stats.outOfStockCount} produit(s) en rupture · `}
                  {stats.lowStockCount > 0 && `${stats.lowStockCount} produit(s) bientôt en rupture`}
                </p>
                <p className="text-xs text-muted-foreground">Réapprovisionnez ces produits pour éviter les ruptures.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSection('stock')}>
              Voir le stock <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card className="lg:col-span-2 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Recettes & Dépenses (7 jours)</h3>
              <p className="text-xs text-muted-foreground">Évolution sur la dernière semaine</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={salesData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="revenue" name="Recettes" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#f59e0b" strokeWidth={2} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-5">
          <h3 className="font-semibold mb-1">Répartition du stock</h3>
          <p className="text-xs text-muted-foreground mb-4">Valeur par catégorie</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats.categoryDistribution.filter((c) => c.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {stats.categoryDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2 max-h-24 overflow-y-auto scrollbar-thin">
            {stats.categoryDistribution.slice(0, 5).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="truncate">{c.name}</span>
                </div>
                <span className="font-medium ml-2 shrink-0">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent sales */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Ventes récentes
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setSection('sales')}>
              Tout voir
            </Button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {stats.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune vente récente</p>
            ) : (
              stats.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {sale.items.map((i) => `${i.itemName} x${i.quantity}`).join(', ') || 'Vente'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getRelativeTime(sale.date)} · {sale.paymentMethod}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-600 shrink-0">{formatCurrency(sale.totalAmount)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Low stock + top products */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Stock faible
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setSection('stock')}>Gérer</Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
              {stats.lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">Tous les stocks sont OK ✓</p>
              ) : (
                stats.lowStockProducts.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{p.name}</span>
                    <Badge variant={p.stockQuantity <= 0 ? 'destructive' : 'secondary'} className="shrink-0">
                      {p.stockQuantity <= 0 ? (
                        <><PackageX className="h-3 w-3 mr-1" />Rupture</>
                      ) : (
                        `${p.stockQuantity} ${p.unit}`
                      )}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              Meilleures ventes
            </h3>
            <div className="space-y-2">
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">Aucune donnée</p>
              ) : (
                stats.topProducts.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm truncate flex-1">{p.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">x{p.quantity}</span>
                    <span className="text-sm font-medium shrink-0">{formatCurrency(p.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
