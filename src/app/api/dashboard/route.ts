import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  getDaysAgo,
} from '@/lib/format'
import type { DashboardStats } from '@/lib/types'

// GET /api/dashboard — compute aggregate stats
export async function GET() {
  try {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)

    // Aggregate queries in parallel
    const [
      todaySalesAgg,
      todayExpensesAgg,
      todayLossesAgg,
      weekSalesAgg,
      monthSalesAgg,
      productCount,
      recentSales,
      allProductsWithCat,
      saleItemsAll,
      categories,
    ] = await Promise.all([
      db.sale.aggregate({
        where: { date: { gte: todayStart, lte: todayEnd } },
        _sum: { totalAmount: true },
      }),
      db.expense.aggregate({
        where: { date: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      db.loss.aggregate({
        where: { date: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      db.sale.aggregate({
        where: { date: { gte: weekStart } },
        _sum: { totalAmount: true },
      }),
      db.sale.aggregate({
        where: { date: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
      db.product.count(),
      db.sale.findMany({
        orderBy: { date: 'desc' },
        take: 5,
        include: { items: { include: { product: true } } },
      }),
      db.product.findMany({ include: { category: true } }),
      db.saleItem.findMany({
        select: { itemName: true, quantity: true, total: true },
      }),
      db.category.findMany({
        include: {
          products: { select: { stockQuantity: true, costPrice: true } },
        },
      }),
    ])

    const todayRevenue = todaySalesAgg._sum.totalAmount ?? 0
    const todayExpenses = todayExpensesAgg._sum.amount ?? 0
    const todayLosses = todayLossesAgg._sum.amount ?? 0
    const todayProfit = todayRevenue - todayExpenses - todayLosses

    const totalStockValue = allProductsWithCat.reduce(
      (sum, p) => sum + p.stockQuantity * p.costPrice,
      0
    )

    const lowStockCountReal = allProductsWithCat.filter(
      (p) => p.stockQuantity > 0 && p.stockQuantity <= p.minThreshold
    ).length
    const outOfStockCountReal = allProductsWithCat.filter(
      (p) => p.stockQuantity <= 0
    ).length

    const lowStockProductsFiltered = allProductsWithCat
      .filter((p) => p.stockQuantity <= p.minThreshold)
      .sort((a, b) => a.stockQuantity - b.stockQuantity)

    // Build salesLast7Days — fetch all sales & expenses in last 7 days, aggregate in JS
    const sevenDaysAgo = startOfDay(getDaysAgo(6))
    const [recent7Sales, recent7Expenses] = await Promise.all([
      db.sale.findMany({
        where: { date: { gte: sevenDaysAgo } },
        select: { date: true, totalAmount: true },
      }),
      db.expense.findMany({
        where: { date: { gte: sevenDaysAgo } },
        select: { date: true, amount: true },
      }),
    ])

    const salesLast7Days: { date: string; revenue: number; expenses: number }[] =
      []
    for (let i = 6; i >= 0; i--) {
      const day = getDaysAgo(i)
      const dateStr = day.toISOString().slice(0, 10)
      const revenue = recent7Sales
        .filter((s) => s.date.toISOString().slice(0, 10) === dateStr)
        .reduce((sum, s) => sum + s.totalAmount, 0)
      const expenses = recent7Expenses
        .filter((e) => e.date.toISOString().slice(0, 10) === dateStr)
        .reduce((sum, e) => sum + e.amount, 0)
      salesLast7Days.push({ date: dateStr, revenue, expenses })
    }

    // Top products — aggregate SaleItem by itemName
    const productMap = new Map<string, { quantity: number; revenue: number }>()
    for (const it of saleItemsAll) {
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

    // Category distribution
    const categoryDistribution = categories.map((c) => {
      const count = c.products.length
      const value = c.products.reduce(
        (sum, p) => sum + p.stockQuantity * p.costPrice,
        0
      )
      return { name: c.name, value, count }
    })

    const stats: DashboardStats = {
      todayRevenue,
      todayExpenses,
      todayLosses,
      todayProfit,
      weekRevenue: weekSalesAgg._sum.totalAmount ?? 0,
      monthRevenue: monthSalesAgg._sum.totalAmount ?? 0,
      totalStockValue,
      productCount,
      lowStockCount: lowStockCountReal,
      outOfStockCount: outOfStockCountReal,
      recentSales,
      lowStockProducts: lowStockProductsFiltered,
      salesLast7Days,
      topProducts,
      categoryDistribution,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger les statistiques' },
      { status: 500 }
    )
  }
}
