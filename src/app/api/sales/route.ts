import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sales — list sales with items + product, ordered by date desc, limit 100
// Supports ?from= and ?to= ISO date filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: { date?: { gte?: Date; lte?: Date } } = {}
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    const sales = await db.sale.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        items: { include: { product: true } },
      },
    })
    return NextResponse.json(sales)
  } catch (error) {
    console.error('GET /api/sales error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger les ventes' },
      { status: 500 }
    )
  }
}

// POST /api/sales — create a sale with nested items
// { date?, paymentMethod, customerName?, notes?, items: [{ productId?, itemName, quantity, unitPrice }] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      date,
      paymentMethod,
      customerName,
      notes,
      items,
    } = body as {
      date?: string
      paymentMethod?: string
      customerName?: string | null
      notes?: string | null
      items?: Array<{
        productId?: string | null
        itemName?: string
        quantity?: number
        unitPrice?: number
      }>
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un article est requis' },
        { status: 400 }
      )
    }

    // Compute totals
    const computedItems = items.map((it) => {
      const quantity = Number(it.quantity) || 1
      const unitPrice = Number(it.unitPrice) || 0
      const total = quantity * unitPrice
      return {
        productId: it.productId || null,
        itemName: it.itemName ?? 'Article',
        quantity,
        unitPrice,
        total,
      }
    })

    const totalAmount = computedItems.reduce(
      (sum, it) => sum + it.total,
      0
    )

    // Build nested items payload
    const itemsPayload = computedItems.map((it) => ({
      productId: it.productId || null,
      itemName: it.itemName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total,
    }))

    // Transaction: create sale, decrement stock + create SORTIE movements
    const result = await db.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          date: date ? new Date(date) : new Date(),
          totalAmount,
          paymentMethod: paymentMethod ?? 'espèces',
          customerName: customerName ?? null,
          notes: notes ?? null,
          items: { create: itemsPayload },
        },
        include: { items: { include: { product: true } } },
      })

      // Decrement stock for items with productId and create SORTIE movements
      for (const it of computedItems) {
        if (!it.productId) continue
        const product = await tx.product.findUnique({
          where: { id: it.productId },
        })
        if (!product) continue

        const newStock = Math.max(0, product.stockQuantity - it.quantity)
        await tx.product.update({
          where: { id: it.productId },
          data: { stockQuantity: newStock },
        })

        await tx.stockMovement.create({
          data: {
            productId: it.productId,
            type: 'SORTIE',
            quantity: it.quantity,
            reason: 'vente',
            unitCost: 0,
            notes: `Vente ${sale.id}`,
          },
        })

        // Auto-generate stock alerts
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
        if (newStock <= 0) {
          const existing = await tx.notification.findFirst({
            where: {
              type: 'out_of_stock',
              productId: it.productId,
              read: false,
              createdAt: { gte: since },
            },
          })
          if (!existing) {
            await tx.notification.create({
              data: {
                type: 'out_of_stock',
                message: `RUPTURE — ${product.name} est en rupture de stock`,
                productId: it.productId,
              },
            })
          }
        } else if (newStock <= product.minThreshold) {
          const existing = await tx.notification.findFirst({
            where: {
              type: 'low_stock',
              productId: it.productId,
              read: false,
              createdAt: { gte: since },
            },
          })
          if (!existing) {
            await tx.notification.create({
              data: {
                type: 'low_stock',
                message: `STOCK FAIBLE — ${product.name} : ${newStock} ${product.unit} restant(s)`,
                productId: it.productId,
              },
            })
          }
        }
      }

      return sale
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('POST /api/sales error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
