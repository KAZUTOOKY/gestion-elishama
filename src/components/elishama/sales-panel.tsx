'use client'

import { useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Sale, Product } from '@/lib/types'
import { SectionHeader } from './section-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { toast } from 'sonner'
import { formatCurrency, formatDateTime, formatTime, PAYMENT_METHODS } from '@/lib/format'
import {
  ShoppingCart,
  Plus,
  Trash2,
  Minus,
  Receipt,
  CreditCard,
  TrendingUp,
} from 'lucide-react'

interface SaleForm {
  paymentMethod: string
  customerName: string
  notes: string
  items: { productId: string; itemName: string; quantity: number; unitPrice: number }[]
}

export function SalesPanel() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expandedSale, setExpandedSale] = useState<string | null>(null)
  const [form, setForm] = useState<SaleForm>({
    paymentMethod: 'espèces',
    customerName: '',
    notes: '',
    items: [{ productId: '', itemName: '', quantity: 1, unitPrice: 0 }],
  })

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get<Sale[]>('/api/sales'),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products-finished'],
    queryFn: () => api.get<Product[]>('/api/products'),
  })

  const createSale = useMutation({
    mutationFn: (data: SaleForm) =>
      api.post('/api/sales', {
        paymentMethod: data.paymentMethod,
        customerName: data.customerName || undefined,
        notes: data.notes || undefined,
        items: data.items
          .filter((i) => i.itemName.trim() && Number(i.quantity) > 0)
          .map((i) => ({
            productId: i.productId || undefined,
            itemName: i.itemName,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stock-current'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Vente enregistrée avec succès')
      setDialogOpen(false)
      setForm({
        paymentMethod: 'espèces',
        customerName: '',
        notes: '',
        items: [{ productId: '', itemName: '', quantity: 1, unitPrice: 0 }],
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteSale = useMutation({
    mutationFn: (id: string) => api.delete(`/api/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Vente supprimée')
      setDeleteId(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const todayTotal = sales
    .filter((s) => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const totalItems = form.items.reduce((sum, i) => sum + (i.quantity || 0), 0)
  const totalAmount = form.items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)

  const updateItem = (index: number, field: keyof SaleForm['items'][0], value: string | number) => {
    setForm((f) => {
      const items = [...f.items]
      items[index] = { ...items[index], [field]: value }
      // If selecting a product, autofill name and price
      if (field === 'productId' && value) {
        const product = products.find((p) => p.id === value)
        if (product) {
          items[index].itemName = product.name
          items[index].unitPrice = product.salePrice || product.costPrice || 0
        }
      }
      return { ...f, items }
    })
  }

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, { productId: '', itemName: '', quantity: 1, unitPrice: 0 }] }))

  const removeItem = (index: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))

  const handleSubmit = () => {
    const validItems = form.items.filter((i) => i.itemName.trim() && i.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Ajoutez au moins un article')
      return
    }
    createSale.mutate(form)
  }

  return (
    <>
      <SectionHeader
        title="Ventes"
        description="Enregistrez les ventes journalières et suivez le chiffre d'affaires"
        icon={<ShoppingCart className="h-5 w-5" />}
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Nouvelle vente
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUp className="h-4 w-4 text-emerald-500" /> CA du jour</div>
          <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(todayTotal)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Receipt className="h-4 w-4" /> Ventes du jour</div>
          <p className="text-xl font-bold mt-1">
            {sales.filter((s) => new Date(s.date).toDateString() === new Date().toDateString()).length}
          </p>
        </Card>
        <Card className="p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><CreditCard className="h-4 w-4" /> Total ventes</div>
          <p className="text-xl font-bold mt-1">{sales.length}</p>
        </Card>
      </div>

      {/* Sales list */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : sales.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mx-auto mb-3" />
            <p className="font-medium">Aucune vente enregistrée</p>
            <p className="text-sm mt-1">Commencez par enregistrer votre première vente.</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Heure</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <Fragment key={sale.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}>
                      <TableCell className="text-sm whitespace-nowrap">
                        <div className="font-medium">{formatTime(sale.date)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(sale.date).toLocaleDateString('fr-FR')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {sale.items.map((i) => `${i.itemName} ×${i.quantity}`).join(', ') || '—'}
                          {sale.items.length > 1 && <Badge variant="outline" className="ml-1.5 text-xs">{sale.items.length} art.</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{sale.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(sale.totalAmount)}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(sale.id) }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedSale === sale.id && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={5} className="py-3">
                          <div className="space-y-1.5">
                            {sale.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{item.itemName} × {item.quantity}</span>
                                <span>{formatCurrency(item.unitPrice)} = <span className="font-medium">{formatCurrency(item.total)}</span></span>
                              </div>
                            ))}
                            {sale.customerName && <p className="text-xs text-muted-foreground pt-1">Client: {sale.customerName}</p>}
                            {sale.notes && <p className="text-xs text-muted-foreground">Note: {sale.notes}</p>}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* New Sale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle vente</DialogTitle>
            <DialogDescription>Enregistrez une vente avec un ou plusieurs articles.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Mode de paiement</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Client (optionnel)</Label>
                <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Nom du client" />
              </div>
            </div>

            {/* Items */}
            <div className="rounded-lg border">
              <div className="flex items-center justify-between p-3 border-b bg-muted/40">
                <Label className="font-semibold">Articles</Label>
                <Button size="sm" variant="ghost" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Article
                </Button>
              </div>
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 sm:col-span-5">
                      <Select value={item.productId} onValueChange={(v) => updateItem(index, 'productId', v)}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="Produit ou saisie libre" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <Input
                        placeholder="Libellé"
                        value={item.itemName}
                        onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qté"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Prix"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500" onClick={() => form.items.length > 1 && removeItem(index)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-3 border-t bg-muted/40">
                <span className="text-sm text-muted-foreground">{totalItems} article(s)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Notes (optionnel)</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createSale.isPending}>
              Enregistrer la vente · {formatCurrency(totalAmount)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette vente ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteSale.mutate(deleteId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
