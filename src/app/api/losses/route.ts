import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/losses — list losses with product, ordered by date desc
export async function GET() {
  try {
    const losses = await db.loss.findMany({
      orderBy: { date: 'desc' },
      include: { product: true },
    })
    return NextResponse.json(losses)
  } catch (error) {
    console.error('GET /api/losses error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger les pertes' },
      { status: 500 }
    )
  }
}

// POST /api/losses — create loss
// { date?, productId?, productName, description, quantity?, amount, type }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      date,
      productId,
      productName,
      description,
      quantity,
      amount,
      type,
    } = body as {
      date?: string
      productId?: string | null
      productName?: string
      description?: string
      quantity?: number
      amount?: number
      type?: string
    }

    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { error: 'Le nom du produit est requis' },
        { status: 400 }
      )
    }
    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'Le montant doit être un nombre positif' },
        { status: 400 }
      )
    }
    if (!type) {
      return NextResponse.json(
        { error: "Le type de perte est requis" },
        { status: 400 }
      )
    }

    const result = await db.$transaction(async (tx) => {
      const loss = await tx.loss.create({
        data: {
          date: date ? new Date(date) : new Date(),
          productId: productId || null,
          productName: productName.trim(),
          description: description ?? '',
          quantity: typeof quantity === 'number' ? quantity : 0,
          amount,
          type,
        },
        include: { product: true },
      })

      // Decrement stock if productId provided and quantity > 0
      if (productId && typeof quantity === 'number' && quantity > 0) {
        const product = await tx.product.findUnique({
          where: { id: productId },
        })
        if (product) {
          const newStock = Math.max(
            0,
            product.stockQuantity - quantity
          )
          await tx.product.update({
            where: { id: productId },
            data: { stockQuantity: newStock },
          })
          await tx.stockMovement.create({
            data: {
              productId,
              type: 'SORTIE',
              quantity,
              reason: 'perte',
              unitCost: 0,
              notes: `Perte: ${type} - ${description ?? ''}`.trim(),
            },
          })
        }
      }

      return loss
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('POST /api/losses error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
