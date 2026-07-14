import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/expenses — list expenses ordered by date desc, limit 100
// Supports ?from=, ?to=, ?category= filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const category = searchParams.get('category')

    const where: {
      date?: { gte?: Date; lte?: Date }
      category?: string
    } = {}
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }
    if (category) where.category = category

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
    })
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger les dépenses' },
      { status: 500 }
    )
  }
}

// POST /api/expenses — create expense
// { date?, category, description, amount, supplier? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, category, description, amount, supplier } = body as {
      date?: string
      category?: string
      description?: string
      amount?: number
      supplier?: string | null
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json(
        { error: 'La catégorie est requise' },
        { status: 400 }
      )
    }
    if (
      !description ||
      typeof description !== 'string' ||
      description.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'La description est requise' },
        { status: 400 }
      )
    }
    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'Le montant doit être un nombre positif' },
        { status: 400 }
      )
    }

    const expense = await db.expense.create({
      data: {
        date: date ? new Date(date) : new Date(),
        category: category.trim(),
        description: description.trim(),
        amount,
        supplier: supplier ?? null,
      },
    })
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('POST /api/expenses error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
