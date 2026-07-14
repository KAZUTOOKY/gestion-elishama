import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from '@/lib/format'

type Period = 'daily' | 'weekly' | 'monthly' | 'annual'

interface Transaction {
  id: string
  type: 'sale' | 'expense' | 'loss'
  date: string
  amount: number
  description: string
}

// GET /api/reports?period=daily|weekly|monthly|annual&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const periodParam = (searchParams.get('period') ?? 'daily') as Period
    const dateParam = searchParams.get('date')
    const period: Period = ['daily', 'weekly', 'monthly', 'annual'].includes(
      periodParam
    )
      ? periodParam
      : 'daily'

    const refDate = dateParam ? new Date(dateParam) : new Date()
    if (isNaN(refDate.getTime())) {
      return NextResponse.json(
        { error: 'Date invalide' },
        { status: 400 }
      )
    }

    // Compute range based on period
    let rangeStart: Date
    let rangeEnd: Date = endOfDay(refDate)

    switch (period) {
      case 'daily':
        rangeStart = startOfDay(refDate)
        rangeEnd = endOfDay(refDate)
        break
      case 'weekly':
        rangeStart = startOfWeek(refDate)
        rangeEnd = endOfDay(refDate)
        break
      case 'monthly':
        rangeStart = startOfMonth(refDate)
        rangeEnd = endOfDay(refDate)
        break
      case 'annual':
        rangeStart = startOfYear(refDate)
        rangeEnd = endOfDay(refDate)
        break
    }

    // Fetch all data in range
    const [sales, expenses, losses, saleItemsInRange] = await Promise.all([
      db.sale.findMany({
        where: { date: { gte: rangeStart, lte: rangeEnd } },
        include: { items: true },
        orderBy: { date: 'desc' },
      }),
      db.expense.findMany({
        where: { date: { gte: rangeStart, lte: rangeEnd } },
        orderBy: { date: 'desc' },
      }),
      db.loss.findMany({
        where: { date: { gte: rangeStart, lte: rangeEnd } },
        orderBy: { date: 'desc' },
      }),
      db.saleItem.findMany({
        where: { sale: { date: { gte: rangeStart, lte: rangeEnd } } },
        select: {
          itemName: true,
          quantity: true,
          total: true,
        },
      }),
    ])

    const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0)
    const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0)
    const lossesTotal = losses.reduce((sum, l) => sum + l.amount, 0)
    const profit = revenue - expensesTotal - lossesTotal
    const salesCount = sales.length
    const avgSale = salesCount > 0 ? revenue / salesCount : 0

    // Expense breakdown by category
    const expenseMap = new Map<string, number>()
    for (const e of expenses) {
      expenseMap.set(e.category, (expenseMap.get(e.category) ?? 0) + e.amount)
    }
    const expenseBreakdown = Array.from(expenseMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    // Daily breakdown
    const dailyBreakdown: { date: string; revenue: number; expenses: number }[] =
      []
    if (period === 'annual') {
      // 12 months aggregated
      for (let m = 0; m < 12; m++) {
        const monthDate = new Date(refDate.getFullYear(), m, 1)
        const monthEnd = new Date(refDate.getFullYear(), m + 1, 0, 23, 59, 59, 999)
        if (monthDate > rangeEnd) continue
        const dateLabel = `${refDate.getFullYear()}-${String(m + 1).padStart(
          2,
          '0'
        )}`
        const rev = sales
          .filter((s) => s.date >= monthDate && s.date <= monthEnd)
          .reduce((sum, s) => sum + s.totalAmount, 0)
        const exp = expenses
          .filter((e) => e.date >= monthDate && e.date <= monthEnd)
          .reduce((sum, e) => sum + e.amount, 0)
        dailyBreakdown.push({ date: dateLabel, revenue: rev, expenses: exp })
      }
    } else {
      // Daily entries from rangeStart to rangeEnd
      const cursor = new Date(startOfDay(rangeStart))
      while (cursor <= rangeEnd) {
        const dateStr = cursor.toISOString().slice(0, 10)
        const dayEnd = endOfDay(cursor)
        const rev = sales
          .filter((s) => s.date >= cursor && s.date <= dayEnd)
          .reduce((sum, s) => sum + s.totalAmount, 0)
        const exp = expenses
          .filter((e) => e.date >= cursor && e.date <= dayEnd)
          .reduce((sum, e) => sum + e.amount, 0)
        dailyBreakdown.push({ date: dateStr, revenue: rev, expenses: exp })
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    // Top products — aggregate by itemName
    const productMap = new Map<string, { quantity: number; revenue: number }>()
    for (const it of saleItemsInRange) {
      const existing = productMap.get(it.itemName) ?? {
        quantity: 0,
        revenue: 0,
      }
      existing.quantity += it.quantity
      existing.revenue += it.total
      productMap.set(it.itemName, existing)
    }
    const topProducts = Array.from(productMap.entries())
      .map(([name, v]) => ({ name, quantity: v.quantity, revenue: v.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Recent transactions — merge sales, expenses, losses
    const transactions: Transaction[] = [
      ...sales.map((s) => ({
        id: s.id,
        type: 'sale' as const,
        date: s.date.toISOString(),
        amount: s.totalAmount,
        description:
          s.customerName || s.items.length > 0
            ? s.customerName
              ? `Vente — ${s.customerName}`
              : `Vente (${s.items.length} article(s))`
            : 'Vente',
      })),
      ...expenses.map((e) => ({
        id: e.id,
        type: 'expense' as const,
        date: e.date.toISOString(),
        amount: e.amount,
        description: e.description,
      })),
      ...losses.map((l) => ({
        id: l.id,
        type: 'loss' as const,
        date: l.date.toISOString(),
        amount: l.amount,
        description: `Perte — ${l.productName} (${l.type})`,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)

    return NextResponse.json({
      period,
      startDate: rangeStart.toISOString(),
      endDate: rangeEnd.toISOString(),
      revenue,
      expenses: expensesTotal,
      losses: lossesTotal,
      profit,
      salesCount,
      avgSale,
      expenseBreakdown,
      dailyBreakdown,
      topProducts,
      recentTransactions: transactions,
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json(
      { error: 'Impossible de générer le rapport' },
      { status: 500 }
    )
  }
}
