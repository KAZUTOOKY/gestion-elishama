import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SETTINGS_ID = 'settings-main'

// GET /api/settings — return settings row (create default if missing)
export async function GET() {
  try {
    const settings = await db.settings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger les paramètres' },
      { status: 500 }
    )
  }
}

// PUT /api/settings — update settings fields
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      restaurantName,
      currency,
      taxRate,
      phone,
      address,
      autoBackup,
      lastBackup,
    } = body as {
      restaurantName?: string
      currency?: string
      taxRate?: number
      phone?: string | null
      address?: string | null
      autoBackup?: boolean
      lastBackup?: string | null
    }

    const data: Record<string, unknown> = {}
    if (typeof restaurantName === 'string') data.restaurantName = restaurantName
    if (typeof currency === 'string') data.currency = currency
    if (typeof taxRate === 'number') data.taxRate = taxRate
    if (phone !== undefined) data.phone = phone ?? null
    if (address !== undefined) data.address = address ?? null
    if (typeof autoBackup === 'boolean') data.autoBackup = autoBackup
    if (lastBackup !== undefined) {
      data.lastBackup = lastBackup ? new Date(lastBackup) : null
    }

    // Upsert: ensure a row exists even on first PUT
    const settings = await db.settings.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...(data as object) },
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
