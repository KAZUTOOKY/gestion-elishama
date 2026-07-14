import { SectionId } from '@/lib/types'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Wallet,
  FileBarChart,
  Bell,
  Settings,
  LucideIcon,
} from 'lucide-react'

export interface NavItem {
  id: SectionId
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', shortLabel: 'Accueil', icon: LayoutDashboard },
  { id: 'products', label: 'Produits & Ingrédients', shortLabel: 'Produits', icon: Package },
  { id: 'stock', label: 'Gestion du Stock', shortLabel: 'Stock', icon: Warehouse },
  { id: 'sales', label: 'Ventes', shortLabel: 'Ventes', icon: ShoppingCart },
  { id: 'expenses', label: 'Dépenses & Pertes', shortLabel: 'Dépenses', icon: Wallet },
  { id: 'reports', label: 'Rapports', shortLabel: 'Rapports', icon: FileBarChart },
  { id: 'notifications', label: 'Notifications', shortLabel: 'Alertes', icon: Bell },
  { id: 'settings', label: 'Paramètres', shortLabel: 'Réglages', icon: Settings },
]

// Items shown in the mobile bottom navigation (max 5)
export const MOBILE_NAV_ITEMS: NavItem[] = [
  NAV_ITEMS[0], // dashboard
  NAV_ITEMS[1], // products
  NAV_ITEMS[2], // stock
  NAV_ITEMS[3], // sales
  NAV_ITEMS[5], // reports
]
