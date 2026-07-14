'use client'

import { AppShell } from '@/components/elishama/app-shell'
import { useNavStore } from '@/store/nav'
import { DashboardPanel } from '@/components/elishama/dashboard-panel'
import { ProductsPanel } from '@/components/elishama/products-panel'
import { StockPanel } from '@/components/elishama/stock-panel'
import { SalesPanel } from '@/components/elishama/sales-panel'
import { ExpensesPanel } from '@/components/elishama/expenses-panel'
import { ReportsPanel } from '@/components/elishama/reports-panel'
import { NotificationsPanel } from '@/components/elishama/notifications-panel'
import { SettingsPanel } from '@/components/elishama/settings-panel'

export default function Home() {
  const activeSection = useNavStore((s) => s.activeSection)

  return (
    <AppShell>
      {activeSection === 'dashboard' && <DashboardPanel />}
      {activeSection === 'products' && <ProductsPanel />}
      {activeSection === 'stock' && <StockPanel />}
      {activeSection === 'sales' && <SalesPanel />}
      {activeSection === 'expenses' && <ExpensesPanel />}
      {activeSection === 'reports' && <ReportsPanel />}
      {activeSection === 'notifications' && <NotificationsPanel />}
      {activeSection === 'settings' && <SettingsPanel />}
    </AppShell>
  )
}
