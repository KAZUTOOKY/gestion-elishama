import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stock — list stock movements with product, ordered by date desc, limit 100
// Supports ?productId= and ?type=ENTREE|SORTIE filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId') ?? ''
    const type = searchParams.get('type') ?? ''

    const where: {
      productId?: string
      type?: string
    } = {}
    if (productId) where.productId = productId
    if (type) where.type = type

    const movements = await db.stockMovement.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
      include: { product: true },
    })
    return NextResponse.json(movements)
  } catch (error) {
    console.error('GET /api/stock error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger les mouvements de stock' },
      { status: 500 }
    )
  }
}

// POST /api/stock — create a movement
// { productId, type: 'ENTREE'|'SORTIE', quantity, reason, unitCost?, notes? }
// Updates product stockQuantity accordingly. Auto-generates low_stock / out_of_stock notifications.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      productId,
      type,
      quantity,
      reason,
      unitCost,
      notes,
    } = body as {
      productId?: string
      type?: string
      quantity?: number
      reason?: string
      unitCost?: number
      notes?: string | null
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Le produit est requis' },
        { status: 400 }
      )
    }
    if (type !== 'ENTREE' && type !== 'SORTIE') {
      return NextResponse.json(
        { error: "Le type doit être 'ENTREE' ou 'SORTIE'" },
        { status: 400 }
      )
    }
    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'La quantité doit être un nombre positif' },
        { status: 400 }
      )
    }

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }

    // Compute new stock
    let newStock = product.stockQuantity
    if (type === 'ENTREE') {
      newStock = product.stockQuantity + quantity
    } else {
      // SORTIE — cap at 0
      newStock = Math.max(0, product.stockQuantity - quantity)
    }

    // Use a transaction to update product + create movement
    const [updatedProduct, movement] = await db.$transaction([
      db.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      }),
      db.stockMovement.create({
        data: {
          productId,
          type,
          quantity,
          reason: reason ?? (type === 'ENTREE' ? 'achat' : 'vente'),
          unitCost: typeof unitCost === 'number' ? unitCost : 0,
          notes: notes ?? null,
        },
        include: { product: true },
      }),
    ])

    // Auto-generate notifications
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago
    if (updatedProduct.stockQuantity <= 0) {
      // out_of_stock notification (if no recent unread of same type for product)
      const existing = await db.notification.findFirst({
        where: {
          type: 'out_of_stock',
          productId,
          read: false,
          createdAt: { gte: since },
        },
      })
      if (!existing) {
        await db.notification.create({
          data: {
            type: 'out_of_stock',
            message: `RUPTURE — ${updatedProduct.name} est en rupture de stock`,
            productId,
          },
        })
      }
    } else if (updatedProduct.stockQuantity <= updatedProduct.minThreshold) {
      const existing = await db.notification.findFirst({
        where: {
          type: 'low_stock',
          productId,
          read: false,
          createdAt: { gte: since },
        },
      })
      if (!existing) {
        await db.notification.create({
          data: {
            type: 'low_stock',
            message: `STOCK FAIBLE — ${updatedProduct.name} : ${updatedProduct.stockQuantity} ${updatedProduct.unit} restant(s)`,
            productId,
          },
        })
      }
    }

    return NextResponse.json(movement, { status: 201 })
  } catch (error) {
    console.error('POST /api/stock error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
