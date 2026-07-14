'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Product, StockMovement, StockMovementType, Category } from '@/lib/types'
import { SectionHeader } from './section-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatCurrency, formatDateTime, STOCK_REASONS_IN, STOCK_REASONS_OUT } from '@/lib/format'
import {
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  Search,
  AlertTriangle,
  PackageX,
  Package,
  History,
  Boxes,
} from 'lucide-react'

interface CurrentStockItem extends Product {
  status: 'out' | 'low' | 'ok'
  stockValue: number
}

export function StockPanel() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('current')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [movementType, setMovementType] = useState<StockMovementType>('ENTREE')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    productId: '',
    quantity: 1,
    reason: 'achat',
    unitCost: 0,
    notes: '',
  })

  const { data: stock = [], isLoading: stockLoading } = useQuery({
    queryKey: ['stock-current'],
    queryFn: () => api.get<CurrentStockItem[]>('/api/stock/current'),
  })

  const { data: movements = [], isLoading: movLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => api.get<(StockMovement & { product?: Product })[]>('/api/stock'),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => api.get<Product[]>('/api/products'),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/api/categories'),
  })

  const createMovement = useMutation({
    mutationFn: (data: { productId: string; type: StockMovementType; quantity: number; reason: string; unitCost: number; notes?: string }) =>
      api.post('/api/stock', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-current'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Mouvement de stock enregistré')
      setDialogOpen(false)
      setForm({ productId: '', quantity: 1, reason: 'achat', unitCost: 0, notes: '' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const filteredStock = stock.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    const matchCategory = categoryFilter === 'all' || s.categoryId === categoryFilter
    return matchSearch && matchStatus && matchCategory
  })

  const totalValue = stock.reduce((sum, s) => sum + s.stockValue, 0)
  const lowCount = stock.filter((s) => s.status === 'low').length
  const outCount = stock.filter((s) => s.status === 'out').length

  const openMovement = (type: StockMovementType) => {
    setMovementType(type)
    setForm({
      productId: products[0]?.id ?? '',
      quantity: 1,
      reason: type === 'ENTREE' ? 'achat' : 'vente',
      unitCost: 0,
      notes: '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!form.productId) return toast.error('Sélectionnez un produit')
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error('Quantité invalide')
    createMovement.mutate({
      productId: form.productId,
      type: movementType,
      quantity: Number(form.quantity),
      reason: form.reason,
      unitCost: Number(form.unitCost) || 0,
      notes: form.notes,
    })
  }

  return (
    <>
      <SectionHeader
        title="Gestion du Stock"
        description="Suivez les entrées, sorties et niveaux de stock en temps réel"
        icon={<Warehouse className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => openMovement('SORTIE')}>
              <ArrowUpFromLine className="h-4 w-4 mr-1.5" /> Sortie
            </Button>
            <Button size="sm" onClick={() => openMovement('ENTREE')}>
              <ArrowDownToLine className="h-4 w-4 mr-1.5" /> Entrée
            </Button>
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm"><Boxes className="h-4 w-4" /> Valeur totale</div>
          <p className="text-base sm:text-xl font-bold mt-1">{formatCurrency(totalValue)}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-amber-600 text-xs sm:text-sm"><AlertTriangle className="h-4 w-4" /> Stock faible</div>
          <p className="text-base sm:text-xl font-bold mt-1">{lowCount}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-red-500 text-xs sm:text-sm"><PackageX className="h-4 w-4" /> Ruptures</div>
          <p className="text-base sm:text-xl font-bold mt-1">{outCount}</p>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="current"><Package className="h-4 w-4 mr-1.5" /> Stock actuel</TabsTrigger>
          <TabsTrigger value="movements"><History className="h-4 w-4 mr-1.5" /> Mouvements</TabsTrigger>
        </TabsList>

        {/* Current Stock */}
        <TabsContent value="current">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ok">En stock</SelectItem>
                <SelectItem value="low">Stock faible</SelectItem>
                <SelectItem value="out">Rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="overflow-hidden">
            {stockLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : filteredStock.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2" />
                Aucun produit
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Valeur</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStock.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{s.category?.name ?? '—'}</TableCell>
                        <TableCell className="text-right font-semibold">{s.stockQuantity} {s.unit}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.stockValue)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={s.status === 'out' ? 'destructive' : 'secondary'}
                            className={s.status === 'low' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : s.status === 'ok' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : ''}
                          >
                            {s.status === 'out' ? 'Rupture' : s.status === 'low' ? 'Faible' : 'OK'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Movements */}
        <TabsContent value="movements">
          <Card className="overflow-hidden">
            {movLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : movements.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2" />
                Aucun mouvement enregistré
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Coût</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(m.date)}</TableCell>
                        <TableCell className="font-medium">{m.product?.name ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === 'ENTREE' ? 'default' : 'secondary'} className={m.type === 'ENTREE' ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-red-500/15 text-red-600 hover:bg-red-500/15'}>
                            {m.type === 'ENTREE' ? <><ArrowDownToLine className="h-3 w-3 mr-1" />Entrée</> : <><ArrowUpFromLine className="h-3 w-3 mr-1" />Sortie</>}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm capitalize">{m.reason.replace('_', ' ')}</TableCell>
                        <TableCell className="text-right font-semibold">{m.type === 'ENTREE' ? '+' : '−'}{m.quantity}</TableCell>
                        <TableCell className="text-right text-sm">{m.unitCost ? formatCurrency(m.unitCost * m.quantity) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Movement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {movementType === 'ENTREE' ? <ArrowDownToLine className="h-5 w-5 text-emerald-500" /> : <ArrowUpFromLine className="h-5 w-5 text-red-500" />}
              {movementType === 'ENTREE' ? 'Entrée de stock' : 'Sortie de stock'}
            </DialogTitle>
            <DialogDescription>
              {movementType === 'ENTREE'
                ? 'Enregistrez une entrée de stock (achat, retour, ajustement).'
                : 'Enregistrez une sortie de stock (vente, perte, casse).'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Produit</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir un produit" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {categories.map((cat) => {
                    const catProducts = products.filter((p) => p.categoryId === cat.id)
                    if (catProducts.length === 0) return null
                    return (
                      <SelectGroup key={cat.id}>
                        <SelectLabel className="text-xs text-muted-foreground font-semibold">{cat.name}</SelectLabel>
                        {catProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stockQuantity} {p.unit})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Quantité</Label>
                <Input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value as unknown as number })} />
              </div>
              <div className="grid gap-2">
                <Label>Raison</Label>
                <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(movementType === 'ENTREE' ? STOCK_REASONS_IN : STOCK_REASONS_OUT).map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {movementType === 'ENTREE' && (
              <div className="grid gap-2">
                <Label>Coût unitaire (FCFA)</Label>
                <Input type="number" min="0" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value as unknown as number })} />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Notes (optionnel)</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMovement.isPending}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
