import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/categories — all categories with product count, ordered by name
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('GET /api/categories error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger les catégories' },
      { status: 500 }
    )
  }
}

// POST /api/categories — create a category { name, icon?, color? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, icon, color } = body as {
      name?: string
      icon?: string | null
      color?: string | null
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom de la catégorie est requis' },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        icon: icon ?? null,
        color: color ?? null,
      },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('POST /api/categories error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
