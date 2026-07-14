import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// GET /api/products/[id] — single product with category
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: { category: true },
    })
    if (!product) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger le produit' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] — update product fields
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      name,
      categoryId,
      unit,
      costPrice,
      salePrice,
      stockQuantity,
      minThreshold,
      expiryDate,
      notes,
      isIngredient,
    } = body as Record<string, unknown>

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }

    // Build only defined fields
    const data: Record<string, unknown> = {}
    if (typeof name === 'string') data.name = name.trim()
    if (typeof categoryId === 'string') data.categoryId = categoryId
    if (typeof unit === 'string') data.unit = unit
    if (typeof costPrice === 'number') data.costPrice = costPrice
    if (typeof salePrice === 'number') data.salePrice = salePrice
    if (typeof stockQuantity === 'number') data.stockQuantity = stockQuantity
    if (typeof minThreshold === 'number') data.minThreshold = minThreshold
    if (expiryDate !== undefined) {
      data.expiryDate = expiryDate ? new Date(expiryDate as string) : null
    }
    if (notes !== undefined) data.notes = (notes as string) ?? null
    if (typeof isIngredient === 'boolean') data.isIngredient = isIngredient

    const updated = await db.product.update({
      where: { id },
      data,
      include: { category: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/products/[id] — delete product
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }
    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la suppression'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
