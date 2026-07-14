import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate, formatDateTime } from './format'

export interface ReportData {
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

export interface ReportSettings {
  restaurantName: string
  currency: string
  phone: string | null
  address: string | null
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'Journalier',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  annual: 'Annuel',
}

function getExpenseLabel(cat: string): string {
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

export function generateReportPDF(report: ReportData, settings?: ReportSettings): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  const restaurantName = settings?.restaurantName ?? 'ELISHAMA'
  const currency = settings?.currency ?? 'FCFA'

  // ===== Header bar =====
  doc.setFillColor(16, 122, 87) // emerald
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Logo circle
  doc.setFillColor(255, 255, 255)
  doc.circle(margin + 6, 14, 5, 'F')
  doc.setTextColor(16, 122, 87)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('E', margin + 6, 16, { align: 'center' })

  // Restaurant name
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(restaurantName, margin + 14, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Stock & Finances — Gestion de restaurant', margin + 14, 19)

  // Report period badge (right side)
  const periodLabel = PERIOD_LABELS[report.period] ?? report.period
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Rapport ${periodLabel}`, pageWidth - margin, 11, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`${formatDate(report.startDate)} — ${formatDate(report.endDate)}`, pageWidth - margin, 16, { align: 'right' })
  doc.text(`Généré le ${formatDateTime(new Date().toISOString())}`, pageWidth - margin, 21, { align: 'right' })

  let y = 38

  // ===== KPI cards row =====
  const cardW = (contentWidth - 9) / 4 // 4 cards with 3mm gaps
  const cardH = 22
  const kpis = [
    { label: 'Chiffre d\'affaires', value: formatCurrency(report.revenue, currency), color: [16, 122, 87] as [number, number, number], bg: [220, 245, 233] as [number, number, number] },
    { label: 'Dépenses', value: formatCurrency(report.expenses, currency), color: [180, 120, 20] as [number, number, number], bg: [253, 235, 200] as [number, number, number] },
    { label: 'Pertes', value: formatCurrency(report.losses, currency), color: [200, 50, 50] as [number, number, number], bg: [254, 220, 220] as [number, number, number] },
    { label: 'Bénéfice net', value: formatCurrency(report.profit, currency), color: report.profit >= 0 ? [16, 122, 87] : [200, 50, 50], bg: report.profit >= 0 ? [220, 245, 233] : [254, 220, 220] },
  ]

  kpis.forEach((kpi, i) => {
    const x = margin + i * (cardW + 3)
    doc.setFillColor(...kpi.bg)
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F')
    doc.setTextColor(...kpi.color)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text(kpi.label.toUpperCase(), x + 3, y + 6)
    doc.setFontSize(11)
    doc.text(kpi.value, x + 3, y + 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    if (i === 0) doc.text(`${report.salesCount} vente(s)`, x + 3, y + 19)
    if (i === 3) doc.text(`Moy: ${formatCurrency(report.avgSale, currency)}`, x + 3, y + 19)
  })

  y += cardH + 8

  // ===== Section: Daily breakdown =====
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`Évolution ${periodLabel.toLowerCase()}`, margin, y)
  y += 2

  autoTable(doc, {
    startY: y + 2,
    head: [['Date', 'Recettes', 'Dépenses', 'Bénéfice']],
    body: report.dailyBreakdown.map((d) => [
      d.date,
      formatCurrency(d.revenue, currency),
      formatCurrency(d.expenses, currency),
      formatCurrency(d.revenue - d.expenses, currency),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [16, 122, 87], fontSize: 8, halign: 'left' as const },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'right' as const },
      2: { halign: 'right' as const },
      3: { halign: 'right' as const, fontStyle: 'bold' as const },
    },
    margin: { left: margin, right: margin },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // ===== Two columns: Expense breakdown + Top products =====
  const colW = (contentWidth - 5) / 2

  // Expense breakdown
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text('Répartition des dépenses', margin, y)

  autoTable(doc, {
    startY: y + 3,
    head: [['Catégorie', 'Montant']],
    body: report.expenseBreakdown.length > 0
      ? report.expenseBreakdown
          .filter((e) => e.amount > 0)
          .map((e) => [getExpenseLabel(e.category), formatCurrency(e.amount, currency)])
      : [['Aucune dépense', '—']],
    theme: 'grid',
    headStyles: { fillColor: [180, 120, 20], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' as const } },
    margin: { left: margin, right: pageWidth / 2 + 2.5 },
    tableWidth: colW,
  })

  // Top products
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Meilleures ventes', pageWidth / 2 + 2.5, y)

  autoTable(doc, {
    startY: y + 3,
    head: [['Produit', 'Qté', 'Recette']],
    body: report.topProducts.length > 0
      ? report.topProducts.map((p) => [p.name, String(p.quantity), formatCurrency(p.revenue, currency)])
      : [['Aucune vente', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: [16, 122, 87], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'center' as const },
      2: { halign: 'right' as const, fontStyle: 'bold' as const },
    },
    margin: { left: pageWidth / 2 + 2.5, right: margin },
    tableWidth: colW,
  })

  y = Math.max(
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY,
    y + 30
  ) + 8

  // ===== Recent transactions =====
  // Check if we need a new page
  if (y > pageHeight - 60) {
    doc.addPage()
    y = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text('Transactions récentes', margin, y)

  autoTable(doc, {
    startY: y + 3,
    head: [['Date', 'Type', 'Description', 'Montant']],
    body: report.recentTransactions.length > 0
      ? report.recentTransactions.map((t) => [
          formatDateTime(t.date),
          t.type,
          t.label,
          `${t.type === 'vente' ? '+' : '−'}${formatCurrency(t.amount, currency)}`,
        ])
      : [['Aucune transaction', '', '', '']],
    theme: 'striped',
    headStyles: { fillColor: [50, 50, 50], fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: {
      3: { halign: 'right' as const, fontStyle: 'bold' as const },
    },
    margin: { left: margin, right: margin },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // ===== Footer on each page =====
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text(`${restaurantName} — Rapport ${periodLabel}`, margin, pageHeight - 7)
    doc.text(`Page ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
  }

  // ===== Save =====
  const fileName = `rapport_${report.period}_${report.startDate.split('T')[0]}.pdf`
  doc.save(fileName)
}
