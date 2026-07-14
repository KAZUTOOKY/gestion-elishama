import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products — list products with category, optional ?search= and ?categoryId=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() ?? ''
    const categoryId = searchParams.get('categoryId') ?? ''

    const where: {
      name?: { contains: string }
      categoryId?: string
    } = {}

    if (search) {
      where.name = { contains: search }
    }
    if (categoryId) {
      where.categoryId = categoryId
    }

    const products = await db.product.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { category: true },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger les produits' },
      { status: 500 }
    )
  }
}

// POST /api/products — create product
export async function POST(req: NextRequest) {
  try {
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
    } = body as {
      name?: string
      categoryId?: string
      unit?: string
      costPrice?: number
      salePrice?: number
      stockQuantity?: number
      minThreshold?: number
      expiryDate?: string | null
      notes?: string | null
      isIngredient?: boolean
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du produit est requis' },
        { status: 400 }
      )
    }
    if (!categoryId) {
      return NextResponse.json(
        { error: 'La catégorie est requise' },
        { status: 400 }
      )
    }

    // Validate category exists
    const category = await db.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json(
        { error: 'Catégorie introuvable' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name: name.trim(),
        categoryId,
        unit: unit ?? 'unité',
        costPrice: typeof costPrice === 'number' ? costPrice : 0,
        salePrice: typeof salePrice === 'number' ? salePrice : 0,
        stockQuantity: typeof stockQuantity === 'number' ? stockQuantity : 0,
        minThreshold: typeof minThreshold === 'number' ? minThreshold : 5,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes: notes ?? null,
        isIngredient: isIngredient ?? true,
      },
      include: { category: true },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
