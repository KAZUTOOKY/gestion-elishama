import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/notifications — list notifications ordered by createdAt desc, limit 50
export async function GET() {
  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(notifications)
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger les notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications — create notification { type, message, productId? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, message, productId } = body as {
      type?: string
      message?: string
      productId?: string | null
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: "Le type est requis" },
        { status: 400 }
      )
    }
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Le message est requis' },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        type,
        message,
        productId: productId ?? null,
      },
    })
    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('POST /api/notifications error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
