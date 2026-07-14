// Shared types for ELISHAMA Stock Manager

export type SectionId =
  | 'dashboard'
  | 'products'
  | 'stock'
  | 'sales'
  | 'expenses'
  | 'reports'
  | 'notifications'
  | 'settings'

export interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  createdAt: string
}

export interface Product {
  id: string
  name: string
  categoryId: string
  category?: Category
  unit: string
  costPrice: number
  salePrice: number
  stockQuantity: number
  minThreshold: number
  expiryDate: string | null
  notes: string | null
  isIngredient: boolean
  createdAt: string
  updatedAt: string
}

export type StockMovementType = 'ENTREE' | 'SORTIE'

export interface StockMovement {
  id: string
  productId: string
  product?: Product
  type: StockMovementType
  quantity: number
  reason: string
  unitCost: number
  date: string
  notes: string | null
  createdAt: string
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string | null
  product?: Product
  itemName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Sale {
  id: string
  date: string
  totalAmount: number
  paymentMethod: string
  customerName: string | null
  items: SaleItem[]
  notes: string | null
  createdAt: string
}

export interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  supplier: string | null
  createdAt: string
}

export type LossType = 'peremption' | 'gaspillage' | 'casse' | 'vol'

export interface Loss {
  id: string
  date: string
  productId: string | null
  product?: Product
  productName: string
  description: string
  quantity: number
  amount: number
  type: LossType
  createdAt: string
}

export interface Settings {
  id: string
  restaurantName: string
  currency: string
  taxRate: number
  phone: string | null
  address: string | null
  autoBackup: boolean
  lastBackup: string | null
}

export interface Notification {
  id: string
  type: string
  message: string
  productId: string | null
  read: boolean
  createdAt: string
}

export interface Backup {
  id: string
  date: string
  type: string
  size: string
  status: string
  records: number
}

export interface DashboardStats {
  todayRevenue: number
  todayExpenses: number
  todayProfit: number
  todayLosses: number
  weekRevenue: number
  monthRevenue: number
  totalStockValue: number
  productCount: number
  lowStockCount: number
  outOfStockCount: number
  recentSales: Sale[]
  lowStockProducts: Product[]
  salesLast7Days: { date: string; revenue: number; expenses: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  categoryDistribution: { name: string; value: number; count: number }[]
}
