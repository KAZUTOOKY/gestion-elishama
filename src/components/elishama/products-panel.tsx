'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Product, Category } from '@/lib/types'
import { SectionHeader } from './section-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
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
import { formatCurrency, formatDate } from '@/lib/format'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  PackageX,
  CalendarClock,
  FolderPlus,
  Boxes,
} from 'lucide-react'

interface FormState {
  name: string
  categoryId: string
  unit: string
  costPrice: number
  salePrice: number
  stockQuantity: number
  minThreshold: number
  expiryDate: string
  isIngredient: boolean
  notes: string
}

const emptyForm: FormState = {
  name: '',
  categoryId: '',
  unit: 'unité',
  costPrice: 0,
  salePrice: 0,
  stockQuantity: 0,
  minThreshold: 5,
  expiryDate: '',
  isIngredient: true,
  notes: '',
}

const UNITS = ['kg', 'g', 'L', 'mL', 'unité', 'boîte', 'sac', 'paquet', 'bouteille', 'portion']

export function ProductsPanel() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'Package' })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter)
      const url = `/api/products${params.toString() ? `?${params}` : ''}`
      return api.get<Product[]>(url)
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<(Category & { _count?: { products: number } })[]>('/api/categories'),
  })

  const createMutation = useMutation({
    mutationFn: (data: FormState) => api.post<Product>('/api/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Produit ajouté avec succès')
      setDialogOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormState }) =>
      api.put<Product>(`/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Produit modifié')
      setDialogOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Produit supprimé')
      setDeleteId(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; icon: string }) =>
      api.post<Category>('/api/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Catégorie ajoutée')
      setNewCategory({ name: '', icon: 'Package' })
      setCatDialogOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const openAdd = () => {
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' })
    setEditId(null)
    setDialogOpen(true)
  }

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      categoryId: p.categoryId,
      unit: p.unit,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      stockQuantity: p.stockQuantity,
      minThreshold: p.minThreshold,
      expiryDate: p.expiryDate ? p.expiryDate.split('T')[0] : '',
      isIngredient: p.isIngredient,
      notes: p.notes ?? '',
    })
    setEditId(p.id)
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Le nom du produit est requis')
      return
    }
    if (!form.categoryId) {
      toast.error('Veuillez sélectionner une catégorie')
      return
    }
    const payload = {
      ...form,
      costPrice: Number(form.costPrice) || 0,
      salePrice: Number(form.salePrice) || 0,
      stockQuantity: Number(form.stockQuantity) || 0,
      minThreshold: Number(form.minThreshold) || 0,
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
    }
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <>
      <SectionHeader
        title="Produits & Ingrédients"
        description="Gérez votre inventaire de produits et ingrédients"
        icon={<Package className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setCatDialogOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-1.5" /> Catégorie
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1.5" /> Ajouter
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="p-10 text-center">
          <Boxes className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Aucun produit trouvé</p>
          <p className="text-sm text-muted-foreground mt-1">Ajoutez votre premier produit ou ingrédient.</p>
          <Button className="mt-4" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Ajouter un produit
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => {
            const status = p.stockQuantity <= 0 ? 'out' : p.stockQuantity <= p.minThreshold ? 'low' : 'ok'
            return (
              <Card key={p.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category?.name}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={status === 'out' ? 'destructive' : status === 'low' ? 'secondary' : 'outline'}
                    className={status === 'low' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : ''}
                  >
                    {status === 'out' ? (
                      <><PackageX className="h-3 w-3 mr-1" />Rupture</>
                    ) : status === 'low' ? (
                      <><AlertTriangle className="h-3 w-3 mr-1" />Faible</>
                    ) : (
                      <><Package className="h-3 w-3 mr-1" />En stock</>
                    )}
                  </Badge>
                  <span className="text-sm font-semibold">{p.stockQuantity} {p.unit}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Achat: <span className="font-medium text-foreground">{formatCurrency(p.costPrice)}</span></span>
                  {p.salePrice > 0 && (
                    <span>Vente: <span className="font-medium text-foreground">{formatCurrency(p.salePrice)}</span></span>
                  )}
                </div>
                {p.expiryDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                    <CalendarClock className="h-3 w-3" />
                    Péremption: {formatDate(p.expiryDate)}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
            <DialogDescription>
              {editId ? 'Modifiez les informations du produit.' : 'Ajoutez un produit ou ingrédient à votre stock.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Riz parfumé" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Catégorie *</Label>
                <Select value={form.categoryId} onValueChange={(v) => set('categoryId', v)}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Unité</Label>
                <Select value={form.unit} onValueChange={(v) => set('unit', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Prix d'achat (FCFA)</Label>
                <Input type="number" min="0" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Prix de vente (FCFA)</Label>
                <Input type="number" min="0" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Quantité en stock</Label>
                <Input type="number" min="0" value={form.stockQuantity} onChange={(e) => set('stockQuantity', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Seuil minimum (alerte)</Label>
                <Input type="number" min="0" value={form.minThreshold} onChange={(e) => set('minThreshold', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Date de péremption (optionnel)</Label>
              <Input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="ingredient">Ingrédient</Label>
                <p className="text-xs text-muted-foreground">Décochez pour un produit fini à vendre</p>
              </div>
              <Switch id="ingredient" checked={form.isIngredient} onCheckedChange={(v) => set('isIngredient', v)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editId ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
            <DialogDescription>Ajoutez une catégorie pour organiser vos produits.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Nom de la catégorie</Label>
              <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Ex: Légumes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={() => {
                if (!newCategory.name.trim()) return toast.error('Nom requis')
                createCategoryMutation.mutate(newCategory)
              }}
              disabled={createCategoryMutation.isPending}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit et ses mouvements de stock seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
