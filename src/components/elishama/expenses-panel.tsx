'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Expense, Loss, Product } from '@/lib/types'
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
import { formatCurrency, formatDateTime, EXPENSE_CATEGORIES, LOSS_TYPES } from '@/lib/format'
import {
  Wallet,
  Plus,
  Trash2,
  Receipt,
  Truck,
  AlertTriangle,
  TrendingDown,
  ShoppingBag,
} from 'lucide-react'

export function ExpensesPanel() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('expenses')
  const [expenseDialog, setExpenseDialog] = useState(false)
  const [lossDialog, setLossDialog] = useState(false)
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null)
  const [deleteLossId, setDeleteLossId] = useState<string | null>(null)

  const [expenseForm, setExpenseForm] = useState({
    category: 'achat_fournisseur',
    description: '',
    amount: 0,
    supplier: '',
  })
  const [lossForm, setLossForm] = useState({
    productId: '',
    productName: '',
    description: '',
    quantity: 0,
    amount: 0,
    type: 'peremption',
  })

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get<Expense[]>('/api/expenses'),
  })

  const { data: losses = [], isLoading: lossLoading } = useQuery({
    queryKey: ['losses'],
    queryFn: () => api.get<(Loss & { product?: Product })[]>('/api/losses'),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products-all-exp'],
    queryFn: () => api.get<Product[]>('/api/products'),
  })

  const createExpense = useMutation({
    mutationFn: (data: typeof expenseForm) =>
      api.post('/api/expenses', {
        category: data.category,
        description: data.description,
        amount: Number(data.amount),
        supplier: data.supplier || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Dépense enregistrée')
      setExpenseDialog(false)
      setExpenseForm({ category: 'achat_fournisseur', description: '', amount: 0, supplier: '' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const createLoss = useMutation({
    mutationFn: (data: typeof lossForm) =>
      api.post('/api/losses', {
        productId: data.productId || undefined,
        productName: data.productName,
        description: data.description,
        quantity: Number(data.quantity),
        amount: Number(data.amount),
        type: data.type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['losses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stock-current'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Perte enregistrée')
      setLossDialog(false)
      setLossForm({ productId: '', productName: '', description: '', quantity: 0, amount: 0, type: 'peremption' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteExpense = useMutation({
    mutationFn: (id: string) => api.delete(`/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Dépense supprimée')
      setDeleteExpenseId(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteLoss = useMutation({
    mutationFn: (id: string) => api.delete(`/api/losses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['losses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Perte supprimée')
      setDeleteLossId(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const todayExpenses = expenses
    .filter((e) => new Date(e.date).toDateString() === new Date().toDateString())
    .reduce((sum, e) => sum + e.amount, 0)
  const totalLosses = losses.reduce((sum, l) => sum + l.amount, 0)
  const supplierPurchases = expenses.filter((e) => e.category === 'achat_fournisseur')
  const totalPurchases = supplierPurchases.reduce((sum, e) => sum + e.amount, 0)

  const getExpenseLabel = (cat: string) => EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat

  return (
    <>
      <SectionHeader
        title="Dépenses & Pertes"
        description="Suivez les dépenses, achats fournisseurs et pertes"
        icon={<Wallet className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setLossDialog(true)}>
              <AlertTriangle className="h-4 w-4 mr-1.5" /> Pertes
            </Button>
            <Button size="sm" onClick={() => setExpenseDialog(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Dépense
            </Button>
          </>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Wallet className="h-4 w-4 text-amber-500" /> Dépenses du jour</div>
          <p className="text-lg sm:text-xl font-bold mt-1">{formatCurrency(todayExpenses)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Truck className="h-4 w-4 text-teal-500" /> Achats fournisseurs</div>
          <p className="text-lg sm:text-xl font-bold mt-1">{formatCurrency(totalPurchases)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingDown className="h-4 w-4 text-red-500" /> Total pertes</div>
          <p className="text-lg sm:text-xl font-bold mt-1">{formatCurrency(totalLosses)}</p>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-4">
          <TabsTrigger value="expenses"><Receipt className="h-4 w-4 mr-1.5" /> Dépenses</TabsTrigger>
          <TabsTrigger value="purchases"><Truck className="h-4 w-4 mr-1.5" /> Fournisseurs</TabsTrigger>
          <TabsTrigger value="losses"><AlertTriangle className="h-4 w-4 mr-1.5" /> Pertes</TabsTrigger>
        </TabsList>

        {/* Expenses */}
        <TabsContent value="expenses">
          <Card className="overflow-hidden">
            {expLoading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : expenses.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto mb-3" />Aucune dépense enregistrée
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(e.date)}</TableCell>
                        <TableCell><Badge variant="outline">{getExpenseLabel(e.category)}</Badge></TableCell>
                        <TableCell className="text-sm">
                          {e.description}
                          {e.supplier && <span className="block text-xs text-muted-foreground">{e.supplier}</span>}
                        </TableCell>
                        <TableCell className="text-right font-bold text-amber-600">{formatCurrency(e.amount)}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteExpenseId(e.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Supplier purchases */}
        <TabsContent value="purchases">
          <Card className="overflow-hidden">
            {expLoading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : supplierPurchases.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mx-auto mb-3" />Aucun achat fournisseur enregistré
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierPurchases.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(e.date)}</TableCell>
                        <TableCell className="font-medium">{e.supplier || '—'}</TableCell>
                        <TableCell className="text-sm">{e.description}</TableCell>
                        <TableCell className="text-right font-bold text-teal-600">{formatCurrency(e.amount)}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteExpenseId(e.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Losses */}
        <TabsContent value="losses">
          <Card className="overflow-hidden">
            {lossLoading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : losses.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3" />Aucune perte enregistrée
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {losses.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(l.date)}</TableCell>
                        <TableCell className="font-medium">{l.productName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {LOSS_TYPES.find((t) => t.value === l.type)?.label ?? l.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.description}</TableCell>
                        <TableCell className="text-right">{l.quantity || '—'}</TableCell>
                        <TableCell className="text-right font-bold text-red-500">{formatCurrency(l.amount)}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteLossId(l.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Expense Dialog */}
      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle dépense</DialogTitle>
            <DialogDescription>Enregistrez une dépense ou un achat.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Catégorie</Label>
              <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Ex: Achat de riz" />
            </div>
            {expenseForm.category === 'achat_fournisseur' && (
              <div className="grid gap-2">
                <Label>Fournisseur</Label>
                <Input value={expenseForm.supplier} onChange={(e) => setExpenseForm({ ...expenseForm, supplier: e.target.value })} placeholder="Nom du fournisseur" />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Montant (FCFA) *</Label>
              <Input type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value as unknown as number })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog(false)}>Annuler</Button>
            <Button
              onClick={() => {
                if (!expenseForm.description.trim()) return toast.error('Description requise')
                if (!expenseForm.amount || Number(expenseForm.amount) <= 0) return toast.error('Montant invalide')
                createExpense.mutate(expenseForm)
              }}
              disabled={createExpense.isPending}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loss Dialog */}
      <Dialog open={lossDialog} onOpenChange={setLossDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer une perte</DialogTitle>
            <DialogDescription>Produit périmé, gaspillage, casse ou vol.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Produit</Label>
              <Select
                value={lossForm.productId}
                onValueChange={(v) => {
                  const p = products.find((p) => p.id === v)
                  setLossForm({ ...lossForm, productId: v, productName: p?.name ?? lossForm.productName })
                }}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner (optionnel)" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Nom du produit *</Label>
              <Input value={lossForm.productName} onChange={(e) => setLossForm({ ...lossForm, productName: e.target.value })} placeholder="Nom du produit perdu" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Type de perte</Label>
                <Select value={lossForm.type} onValueChange={(v) => setLossForm({ ...lossForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOSS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Quantité</Label>
                <Input type="number" min="0" value={lossForm.quantity} onChange={(e) => setLossForm({ ...lossForm, quantity: e.target.value as unknown as number })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea rows={2} value={lossForm.description} onChange={(e) => setLossForm({ ...lossForm, description: e.target.value })} placeholder="Détails de la perte" />
            </div>
            <div className="grid gap-2">
              <Label>Montant de la perte (FCFA) *</Label>
              <Input type="number" min="0" value={lossForm.amount} onChange={(e) => setLossForm({ ...lossForm, amount: e.target.value as unknown as number })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLossDialog(false)}>Annuler</Button>
            <Button
              onClick={() => {
                if (!lossForm.productName.trim()) return toast.error('Nom du produit requis')
                if (!lossForm.amount || Number(lossForm.amount) <= 0) return toast.error('Montant invalide')
                createLoss.mutate(lossForm)
              }}
              disabled={createLoss.isPending}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteExpenseId} onOpenChange={(o) => !o && setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteExpenseId && deleteExpense.mutate(deleteExpenseId)} className="bg-red-500 hover:bg-red-600">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteLossId} onOpenChange={(o) => !o && setDeleteLossId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette perte ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLossId && deleteLoss.mutate(deleteLossId)} className="bg-red-500 hover:bg-red-600">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
